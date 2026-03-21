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
automated-staging    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — cycle 6
full-e2e             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — cycle 6
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| bff-proxy | specs/bff-proxy.md | DONE | Hono proxy in bff/, docker-compose verified, API key server-side |
| batched-prefetch | specs/batched-prefetch.md | DONE | Promise.allSettled batching, perf test passing |
| automated-staging | TBD | SHAPED | CI pushes to staging + smoke tests on merge (cycle 6) |
| full-e2e | TBD | SHAPED | Complete quiz flow E2E tests for all types + error states (cycle 6) |

## Success Criteria

- [ ] BFF proxy handles all API calls, API key never exposed to client
- [ ] Staging deploys automatically on merge with smoke tests
- [ ] Full E2E coverage for all quiz flows and error states
- [ ] Quiz generation uses batched pre-fetching, sub-1s load on warm cache
- [ ] Unit tests cover all ACs
- [ ] No regression in existing 214 tests
- [ ] Coverage remains >= 90%
- [ ] CI coverage OOM resolved (L-006)

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
| cycle-5 | bff-proxy (SHAPED→DONE), batched-prefetch (SHAPED→DONE) | IN_PROGRESS | Away mode, human returns 2026-03-21 |
