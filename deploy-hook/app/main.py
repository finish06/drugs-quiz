"""
Central deploy webhook — app-aware staging deployment service.

Validates GitHub HMAC signatures, looks up the target app from config,
pulls updated images, restarts the compose stack, and runs smoke tests.

Apps are configured in apps.yaml. Each GitHub repo sends its app name
in the webhook payload.
"""

import hashlib
import hmac
import json
import logging
import os
import subprocess
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
import yaml
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI(title="deploy-hook")
logger = logging.getLogger("deploy-hook")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")
CONFIG_PATH = os.environ.get("CONFIG_PATH", "/etc/deploy-hook/apps.yaml")

# Per-app deploy locks to prevent concurrent deploys to the same app
_deploy_locks: dict[str, threading.Lock] = {}

if not WEBHOOK_SECRET:
    logger.error("WEBHOOK_SECRET not set — webhook will reject all requests")


def load_apps_config() -> dict:
    """Load app configuration from YAML file."""
    path = Path(CONFIG_PATH)
    if not path.exists():
        logger.error(f"Config file not found: {CONFIG_PATH}")
        return {}
    with open(path) as f:
        config = yaml.safe_load(f)
    return config.get("apps", {})


def verify_signature(payload: bytes, signature: str | None) -> bool:
    """Validate GitHub HMAC-SHA256 signature."""
    if not WEBHOOK_SECRET or not signature:
        return False

    if not signature.startswith("sha256="):
        return False

    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)


def run_command(cmd: list[str], cwd: str | None = None) -> tuple[int, str, str]:
    """Run a shell command and return (returncode, stdout, stderr)."""
    logger.info(f"Running: {' '.join(cmd)}")
    result = subprocess.run(
        cmd, capture_output=True, text=True, cwd=cwd, timeout=300
    )
    if result.stdout:
        logger.info(result.stdout.strip())
    if result.stderr:
        logger.warning(result.stderr.strip())
    return result.returncode, result.stdout, result.stderr


def run_smoke_tests(health_checks: list[dict]) -> dict:
    """Run smoke tests against the deployed app."""
    tests = {}

    try:
        with httpx.Client(timeout=10) as client:
            for check in health_checks:
                name = check["name"]
                url = check["url"]
                expect_key = check.get("expect_key")

                resp = client.get(url)
                passed = resp.status_code == 200
                if passed and expect_key:
                    try:
                        passed = expect_key in resp.json()
                    except Exception:
                        passed = False

                tests[name] = {
                    "url": url,
                    "status": resp.status_code,
                    "passed": passed,
                }
    except Exception as e:
        tests["connection_error"] = {"passed": False, "detail": str(e)}

    tests["all_passed"] = all(
        t.get("passed", False) for k, t in tests.items() if k != "all_passed"
    )
    return tests


def get_deploy_lock(app_name: str) -> threading.Lock:
    """Get or create a per-app deploy lock."""
    if app_name not in _deploy_locks:
        _deploy_locks[app_name] = threading.Lock()
    return _deploy_locks[app_name]


@app.get("/health")
async def health():
    apps = load_apps_config()
    return {
        "status": "ok",
        "service": "deploy-hook",
        "apps": list(apps.keys()),
    }


@app.get("/apps")
async def list_apps():
    """List configured apps and their deploy directories."""
    apps = load_apps_config()
    return {
        name: {
            "compose_dir": cfg["compose_dir"],
            "health_checks": len(cfg.get("health_checks", [])),
        }
        for name, cfg in apps.items()
    }


@app.post("/deploy")
async def deploy(
    request: Request,
    x_hub_signature_256: str | None = Header(None),
):
    """Handle deploy webhook from GitHub Actions.

    Expects JSON body with at minimum: {"app": "app-name"}
    Optional fields: ref, sha, tag (for logging)
    """
    body = await request.body()

    # Validate signature
    if not verify_signature(body, x_hub_signature_256):
        logger.warning("Invalid or missing webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Parse payload
    try:
        payload = json.loads(body) if body else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    app_name = payload.get("app")
    if not app_name:
        raise HTTPException(status_code=400, detail="Missing 'app' field in payload")

    # Look up app config
    apps = load_apps_config()
    app_config = apps.get(app_name)
    if not app_config:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown app '{app_name}'. Known apps: {list(apps.keys())}",
        )

    compose_dir = app_config["compose_dir"]
    compose_file = app_config.get("compose_file", "docker-compose.yml")
    health_checks = app_config.get("health_checks", [])

    # Prevent concurrent deploys to the same app
    lock = get_deploy_lock(app_name)
    if not lock.acquire(blocking=False):
        logger.warning(f"Deploy already in progress for {app_name}")
        raise HTTPException(status_code=409, detail=f"Deploy already in progress for {app_name}")

    try:
        started = datetime.now(timezone.utc).isoformat()
        tag = payload.get("tag", "unknown")
        sha = payload.get("sha", "unknown")
        logger.info(f"Deploy started: app={app_name} tag={tag} sha={sha}")
        steps = []

        # Step 1: Pull latest images
        rc, out, err = run_command(
            ["docker", "compose", "-f", compose_file, "pull"], cwd=compose_dir
        )
        steps.append({"step": "pull", "success": rc == 0, "detail": err.strip() if rc != 0 else "ok"})
        if rc != 0:
            return {"status": "failed", "app": app_name, "started": started, "steps": steps}

        # Step 2: Restart services
        rc, out, err = run_command(
            ["docker", "compose", "-f", compose_file, "up", "-d", "--remove-orphans"],
            cwd=compose_dir,
        )
        steps.append({"step": "restart", "success": rc == 0, "detail": err.strip() if rc != 0 else "ok"})
        if rc != 0:
            return {"status": "failed", "app": app_name, "started": started, "steps": steps}

        # Step 3: Wait for services to be ready
        time.sleep(5)

        # Step 4: Smoke tests
        if health_checks:
            smoke = run_smoke_tests(health_checks)
            steps.append({"step": "smoke_tests", "success": smoke["all_passed"], "detail": smoke})
        else:
            steps.append({"step": "smoke_tests", "success": True, "detail": "no health checks configured"})

        status = "success" if all(s["success"] for s in steps) else "partial"
        logger.info(f"Deploy {status}: app={app_name} tag={tag}")

        return {
            "status": status,
            "app": app_name,
            "tag": tag,
            "started": started,
            "completed": datetime.now(timezone.utc).isoformat(),
            "steps": steps,
        }

    finally:
        lock.release()
