# Spec: Automated Staging Deploy

**Version:** 0.1.0
**Created:** 2026-03-21
**PRD Reference:** docs/prd.md M4 (Infrastructure + Quality Hardening)
**Status:** Complete

## 1. Overview

Automate staging deployment via a webhook listener on the staging VM. When CI pushes a new beta image, GitHub Actions hits the webhook, which pulls updated images, rebuilds the BFF, restarts services, and runs smoke tests. Eliminates manual SSH deploy tax.

### User Story

As a developer, I want staging to auto-deploy on every merge to main so I can validate changes without manual SSH + docker compose.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A FastAPI webhook listener in `deploy-hook/` validates GitHub HMAC signatures (`X-Hub-Signature-256`) | Must |
| AC-002 | The webhook runs as a Docker container with `/var/run/docker.sock` mounted, separate from the drugs-quiz compose stack | Must |
| AC-003 | On valid webhook: pull images, rebuild BFF, restart drugs-quiz compose, run smoke tests | Must |
| AC-004 | Smoke tests verify `/api/health` returns 200 and `/api/v1/drugs/classes` returns data | Must |
| AC-005 | The webhook returns deployment status (success/failure + smoke test results) in the response | Must |
| AC-006 | CI workflow (`ci.yml`) pushes a `drugs-quiz-bff:beta` image to the personal registry alongside the frontend image | Must |
| AC-007 | CI workflow triggers the staging webhook after beta images are pushed | Must |
| AC-008 | The webhook rejects requests with invalid or missing signatures (401) | Must |
| AC-009 | The webhook listens on port 9000 | Must |
| AC-010 | The webhook secret is configured via environment variable (`WEBHOOK_SECRET`) | Must |
| AC-011 | Deployment logs are written to stdout (visible via `docker logs`) | Should |
| AC-012 | The webhook is environment-aware: beta trigger → staging, production trigger → production (production not implemented yet, just the routing logic) | Should |

## 3. Architecture

```
GitHub Actions (merge to main)
  ↓ push drugs-quiz:beta + drugs-quiz-bff:beta to registry
  ↓ POST https://drug-quiz.staging.calebdunn.tech:9000/deploy
      with X-Hub-Signature-256 header
  ↓
Staging VM
  deploy-hook container (port 9000, docker.sock mounted)
    ↓ validate HMAC signature
    ↓ cd /opt/drugs-quiz
    ↓ docker compose pull
    ↓ docker compose build bff (if source changed)
    ↓ docker compose up -d
    ↓ curl /api/health + /api/v1/drugs/classes
    ↓ return { status: "success", smoke_tests: "passed" }
```

### Directory Structure

```
deploy-hook/
├── app/
│   └── main.py          # FastAPI app: webhook endpoint + deploy logic
├── Dockerfile
├── requirements.txt
└── docker-compose.yml   # Standalone compose for the webhook container
```

## 4. Security

- HMAC-SHA256 signature verification using `X-Hub-Signature-256` header
- Webhook secret stored as env var, never in code
- Docker socket access is privileged — container should run as non-root where possible
- No shell injection: compose commands are hardcoded, not parameterized from request body

## 5. CI Changes

### BFF Image Push (new job in ci.yml)

Add to the existing `docker-beta` job:
```yaml
- name: Build and push BFF beta image
  run: |
    docker build -t "dockerhub.calebdunn.tech/drugs-quiz-bff:beta" ./bff
    docker push "dockerhub.calebdunn.tech/drugs-quiz-bff:beta"
```

### Webhook Trigger (new step after image push)

```yaml
- name: Trigger staging deploy
  run: |
    curl -X POST https://drug-quiz.staging.calebdunn.tech:9000/deploy \
      -H "Content-Type: application/json" \
      -H "X-Hub-Signature-256: sha256=$(echo -n '{}' | openssl dgst -sha256 -hmac '${{ secrets.WEBHOOK_SECRET }}' | awk '{print $2}')" \
      -d '{}'
```

## 6. Staging VM Changes

### Update /opt/drugs-quiz/docker-compose.yml

Change BFF service from `build: ./bff` to `image: dockerhub.calebdunn.tech/drugs-quiz-bff:beta` so it pulls from registry instead of building locally.

### Deploy webhook container

```bash
cd /opt/deploy-hook
docker compose up -d
```

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Invalid signature | Return 401, do not deploy |
| Deploy fails (compose error) | Return 500 with error details, old containers stay running |
| Smoke test fails after deploy | Return 200 with `smoke_tests: "failed"` — don't auto-rollback (manual investigation needed) |
| Webhook receives concurrent requests | Queue or reject concurrent deploys (simple mutex/lock file) |
| Docker socket not mounted | Fail fast on startup with clear error |
| Registry unreachable | Return 500 with pull failure details |

## 8. Dependencies

- GitHub repo secret: `WEBHOOK_SECRET` (shared between CI and webhook)
- Staging VM: port 9000 accessible (may need reverse proxy or firewall rule)
- Personal registry: `dockerhub.calebdunn.tech` credentials for BFF image push

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-21 | 0.1.0 | Caleb Dunn | Initial spec from cycle 7 interview |
