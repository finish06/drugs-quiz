# Milestone M4 — Infrastructure + Quality Hardening

**Goal:** Build the technical foundation for user accounts and social features. Make the existing product bulletproof.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-03-20

## Hill Chart

```
bff-proxy            ████████████████████████████████████  DONE — Hono proxy, docker-compose verified
batched-prefetch     ████████████████████████████████████  DONE — Promise.allSettled batching, perf test passing
automated-staging    ████████████░░░░░░░░░░░░░░░░░░░░░░░░  SPECCED — spec + implementation in cycle 7
full-e2e             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — cycle 6
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| bff-proxy | specs/bff-proxy.md | DONE | Hono proxy in bff/, docker-compose verified, API key server-side |
| batched-prefetch | specs/batched-prefetch.md | DONE | Promise.allSettled batching, perf test passing |
| automated-staging | specs/automated-staging.md | IN_PROGRESS | FastAPI webhook + CI integration (cycle 7) |
| full-e2e | TBD | SHAPED | Complete quiz flow E2E tests for all types + error states (cycle 6) |

## Success Criteria

- [x] BFF proxy handles all API calls, API key never exposed to client
- [ ] Staging deploys automatically on merge with smoke tests
- [ ] Full E2E coverage for all quiz flows and error states
- [x] Quiz generation uses batched pre-fetching, sub-1s load on warm cache
- [ ] Unit tests cover all ACs
- [ ] No regression in existing 214 tests
- [ ] Coverage remains >= 90%
- [ ] CI coverage OOM resolved (L-006)

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
| cycle-5 | bff-proxy (SHAPED→DONE), batched-prefetch (SHAPED→DONE) | COMPLETE | Merged PR #4, beta-ef2fb41 deployed |
| cycle-6 | 9 tier-1 bug fixes from swarm audit | COMPLETE | Merged PR #5, v0.3.1 tagged. Staging redeployed from /opt with BFF. All 9 bugs validated fixed by swarm retest. |
