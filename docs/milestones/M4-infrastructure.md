# Milestone M4 — Infrastructure + Quality Hardening

**Goal:** Build the technical foundation for user accounts and social features. Make the existing product bulletproof.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** COMPLETE
**Started:** 2026-03-20
**Completed:** 2026-03-22

## Hill Chart

```
bff-proxy            ████████████████████████████████████  DONE — Hono proxy, docker-compose verified
batched-prefetch     ████████████████████████████████████  DONE — Promise.allSettled batching, perf test passing
automated-staging    ████████████████████████████████████  DONE — FastAPI webhook + CI, end-to-end verified
full-e2e             ████████████████████████████████████  DONE — 6 E2E spec files, 11+ test scenarios, 4 bugs fixed
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| bff-proxy | specs/bff-proxy.md | DONE | Hono proxy in bff/, docker-compose verified, API key server-side |
| batched-prefetch | specs/batched-prefetch.md | DONE | Promise.allSettled batching, perf test passing |
| automated-staging | specs/automated-staging.md | DONE | FastAPI webhook + CI integration, HMAC signatures, smoke tests |
| full-e2e | specs/ (comprehensive) | DONE | 6 Playwright spec files, 11+ scenarios, 4 tier-2 bugs fixed |

## Success Criteria

- [x] BFF proxy handles all API calls, API key never exposed to client
- [x] Staging deploys automatically on merge with smoke tests
- [x] Full E2E coverage for all quiz flows and error states
- [x] Quiz generation uses batched pre-fetching, sub-1s load on warm cache
- [x] Unit tests cover all ACs (212 passing)
- [x] No regression in existing tests
- [x] Coverage remains >= 90% (92.62% statements, 94.63% lines)
- [x] CI pipeline operational (lint, types, test, build, push, deploy)

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
| cycle-5 | bff-proxy (SHAPED→DONE), batched-prefetch (SHAPED→DONE) | COMPLETE | Merged PR #4, beta-ef2fb41 deployed |
| cycle-6 | 9 tier-1 bug fixes from swarm audit | COMPLETE | Merged PR #5, v0.3.1 tagged. Staging redeployed from /opt with BFF. All 9 bugs validated fixed by swarm retest. |
| cycle-7 | automated-staging (SPECCED→DONE) | COMPLETE | Merged PR #6. FastAPI deploy-hook, CI integration, end-to-end verified. |
| cycle-8 | full-e2e (SHAPED→DONE), 4 tier-2 bugs | COMPLETE | Merged PR #7. 6 Playwright spec files, 11+ scenarios. Bugs: race condition, error boundary, double-click, exit confirmation. |
