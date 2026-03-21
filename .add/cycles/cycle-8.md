# Cycle 8 — Full E2E Tests + Tier 2 Bug Fixes

**Milestone:** M4 — Infrastructure + Quality Hardening
**Maturity:** Beta
**Status:** PLANNED
**Started:** 2026-03-21
**Completed:** TBD
**Duration Budget:** ~4-5 hours (async, human returns in a few hours)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| full-e2e | SHAPED | DONE | Agent-1 | ~3 hrs | 11 Playwright E2E tests passing |
| bug-9 (race condition) | OPEN | FIXED | Agent-1 | ~1 hr | E2E reproduces and verifies fix |
| bug-10 (error boundary) | OPEN | FIXED | Agent-1 | ~30 min | E2E error state test uses boundary |
| bug-15 (double-click start) | OPEN | FIXED | Agent-1 | ~20 min | E2E double-click test |
| bug-17 (exit confirmation) | OPEN | FIXED | Agent-1 | ~20 min | E2E exit test |

## Dependencies & Serialization

```
Bug fixes first (error boundary, race condition, double-click, exit confirm)
    ↓
E2E tests exercise the fixed behavior
```

## E2E Test Matrix

| Test | Flow |
|------|------|
| 1 | Name the Class: start → answer 5 MC → results |
| 2 | Match Drug to Class: start → match pairs → submit → results |
| 3 | Brand/Generic Match: start → match pairs → results |
| 4 | Quick 5: button → 5 mixed questions → results |
| 5 | Session history: complete quiz → home shows entry |
| 6 | Answer review: complete quiz → expand review → verify |
| 7 | Study Weak Drugs: get wrong → Study button → flashcard → exit |
| 8 | Error state: mock API failure → error → retry |
| 9 | Exit mid-quiz: start → Exit → confirm → back to config |
| 10 | Double-click Start: click twice fast → one session |
| 11 | Progress bar: starts 0%, advances on answer |

## E2E Approach

- Playwright with `page.route()` to mock `/api/*` responses
- No real BFF or drug-gate needed
- Screenshots on failure only
- Tests in `tests/e2e/`

## Validation Criteria

- [ ] 11 E2E tests passing
- [ ] 4 Tier 2 bugs fixed (9, 10, 15, 17)
- [ ] All 212+ unit tests still passing
- [ ] Coverage >= 90%
- [ ] Types clean, lint clean
- [ ] PR created for human review
- [ ] Handoff updated

## Agent Autonomy & Checkpoints

Beta + Away: Create PR, do NOT merge. Human reviews on return.
