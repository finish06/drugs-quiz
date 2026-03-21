# Cycle 5 — BFF Proxy + Batched Pre-fetching

**Milestone:** M4 — Infrastructure + Quality Hardening
**Maturity:** Beta
**Status:** PLANNED
**Started:** 2026-03-20
**Completed:** TBD
**Duration Budget:** ~12-16 hours (async, human returns tomorrow)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| bff-proxy | SHAPED | DONE | Agent-1 | ~4-5 hours | Spec ACs passing, docker-compose verified locally, API key server-side |
| batched-prefetch | SHAPED | DONE | Agent-1 | ~2-3 hours | Spec ACs passing, performance test blocking, sub-1s generation |

## Dependencies & Serialization

```
bff-proxy (first)
    ↓ (batched-prefetch builds on new proxy API client)
batched-prefetch (second)
```

BFF proxy ships first because:
1. Introduces the proxy service that batched prefetch will call
2. Rewires frontend API client from drug-gate direct → proxy
3. Batched prefetch modifies generators that use the API client

## Parallel Strategy

Single-threaded execution. Features advance sequentially.

### File Reservations
- **bff-proxy:** `bff/**` (new), `src/services/api-client.ts`, `docker-compose.yml`, `Dockerfile` (frontend)
- **batched-prefetch:** `src/services/quiz-generators.ts`, `src/services/quiz-generators.test.ts`

### Merge Sequence
1. Both features in a single PR (architectural change is cohesive)

## Validation Criteria

### Per-Item Validation
- **bff-proxy:**
  - Hono proxy in `bff/` with own package.json, Dockerfile, tsconfig
  - All drug-gate endpoints proxied with API key injected server-side
  - Frontend api-client.ts rewired to hit BFF (no more direct drug-gate calls)
  - Frontend in-memory cache removed (drug-gate 60-min cache is sufficient)
  - docker-compose updated with bff service
  - CORS configured for local dev
  - docker-compose up works locally (both containers healthy)
- **batched-prefetch:**
  - Quiz generators use Promise.allSettled for parallel API calls
  - usedDrugs deduplication preserved across parallel calls
  - Blocking performance test asserts generation time under budget
  - All existing generator tests pass (no regression)

### Cycle Success Criteria
- [ ] All ACs implemented and tested
- [ ] docker-compose verified locally (both containers start and communicate)
- [ ] Performance test passes (blocking)
- [ ] Full test suite passes (214+ existing tests, no regressions)
- [ ] Coverage remains >= 90%
- [ ] PR created for human review (no autonomous merge)
- [ ] Handoff doc updated before session end (L-005)

## Agent Autonomy & Checkpoints

Beta + Away Mode: Balanced autonomy. Agent writes specs, implements via TDD, creates PR. Human reviews and merges on return. Handoff written before session ends.

**Boundaries (away mode):**
- DO: Write specs, implement, test, create PR, push to feature branch
- DO: Verify docker-compose works locally
- DO NOT: Merge to main
- DO NOT: Deploy to staging
- DO NOT: Make irreversible architecture decisions beyond what was agreed

## Notes

- BFF is a pure passthrough proxy — no caching, no business logic, just API key injection + CORS
- Frontend cache in api-client.ts gets removed (requestCache map + CACHE_TTL_MS)
- Rollback plan: simple git revert + redeploy if BFF breaks staging
- CI coverage OOM (L-006) — if encountered again, coverage step is already advisory
- Remember to update handoff.md (L-005 — flagged in retro as non-negotiable)
