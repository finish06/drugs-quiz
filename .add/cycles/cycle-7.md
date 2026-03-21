# Cycle 7 — Automated Staging Deploy

**Milestone:** M4 — Infrastructure + Quality Hardening
**Maturity:** Beta
**Status:** PLANNED
**Started:** 2026-03-21
**Completed:** TBD
**Duration Budget:** ~3-4 hours (async, human returns in a few hours)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| automated-staging | SHAPED | DONE | Agent-1 | ~3 hrs | Spec ACs passing, webhook deployed on staging, CI triggers deploy |

## Dependencies & Serialization

Single feature. No dependencies.

## Validation Criteria

- [ ] FastAPI webhook listener in deploy-hook/ validates HMAC signatures
- [ ] Webhook container deployed on staging VM with docker.sock access
- [ ] CI pushes drugs-quiz-bff:beta image alongside frontend
- [ ] CI triggers staging webhook after image push
- [ ] Smoke tests verify health + API proxy after deploy
- [ ] Invalid signatures rejected (401)
- [ ] Staging compose uses registry images (no local builds)
- [ ] PR created for human review

## Agent Autonomy & Checkpoints

Beta + Away: Create PR, do NOT merge. Human reviews on return.
- DO: Write spec, implement, push to feature branch
- DO NOT: Deploy webhook to staging (needs secrets), merge to main
