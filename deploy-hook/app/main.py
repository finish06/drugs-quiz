"""
Deploy webhook for drugs-quiz staging.

Validates GitHub HMAC signatures, pulls updated images,
restarts the compose stack, and runs smoke tests.
"""

import hashlib
import hmac
import logging
import os
import subprocess
import threading
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI(title="drugs-quiz deploy-hook")
logger = logging.getLogger("deploy-hook")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")
COMPOSE_DIR = os.environ.get("COMPOSE_DIR", "/opt/drugs-quiz")
SMOKE_TEST_URL = os.environ.get("SMOKE_TEST_URL", "http://drugs-quiz:8080")

# Simple deploy lock to prevent concurrent deploys
_deploy_lock = threading.Lock()

if not WEBHOOK_SECRET:
    logger.error("WEBHOOK_SECRET not set — webhook will reject all requests")


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


def run_smoke_tests() -> dict:
    """Run smoke tests against the deployed app."""
    tests = {}

    try:
        with httpx.Client(timeout=10) as client:
            # Health check
            resp = client.get(f"{SMOKE_TEST_URL}/api/health")
            tests["health"] = {
                "status": resp.status_code,
                "passed": resp.status_code == 200,
            }

            # API proxy check
            resp = client.get(
                f"{SMOKE_TEST_URL}/api/v1/drugs/classes",
                params={"type": "epc", "limit": "1"},
            )
            tests["api_proxy"] = {
                "status": resp.status_code,
                "passed": resp.status_code == 200 and "data" in resp.json(),
            }
    except Exception as e:
        tests["error"] = {"passed": False, "detail": str(e)}

    tests["all_passed"] = all(
        t.get("passed", False) for t in tests.values()
    )
    return tests


@app.get("/health")
async def health():
    return {"status": "ok", "service": "deploy-hook"}


@app.post("/deploy")
async def deploy(
    request: Request,
    x_hub_signature_256: str | None = Header(None),
):
    """Handle deploy webhook from GitHub Actions."""
    body = await request.body()

    # Validate signature
    if not verify_signature(body, x_hub_signature_256):
        logger.warning("Invalid or missing webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Prevent concurrent deploys
    if not _deploy_lock.acquire(blocking=False):
        logger.warning("Deploy already in progress")
        raise HTTPException(status_code=409, detail="Deploy already in progress")

    try:
        started = datetime.now(timezone.utc).isoformat()
        logger.info(f"Deploy started at {started}")
        steps = []

        # Step 1: Pull latest images
        rc, out, err = run_command(
            ["docker", "compose", "pull"], cwd=COMPOSE_DIR
        )
        steps.append({"step": "pull", "success": rc == 0, "detail": err if rc != 0 else "ok"})
        if rc != 0:
            return {"status": "failed", "started": started, "steps": steps}

        # Step 2: Restart services
        rc, out, err = run_command(
            ["docker", "compose", "up", "-d", "--remove-orphans"], cwd=COMPOSE_DIR
        )
        steps.append({"step": "restart", "success": rc == 0, "detail": err if rc != 0 else "ok"})
        if rc != 0:
            return {"status": "failed", "started": started, "steps": steps}

        # Step 3: Wait for services to be ready
        import time
        time.sleep(5)

        # Step 4: Smoke tests
        smoke = run_smoke_tests()
        steps.append({"step": "smoke_tests", "success": smoke["all_passed"], "detail": smoke})

        status = "success" if all(s["success"] for s in steps) else "partial"
        logger.info(f"Deploy {status}: {steps}")

        return {
            "status": status,
            "started": started,
            "completed": datetime.now(timezone.utc).isoformat(),
            "steps": steps,
        }

    finally:
        _deploy_lock.release()
