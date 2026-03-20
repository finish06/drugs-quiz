# Cycle 3 — Session History + Quick 5

**Milestone:** M3 — Learning Loop & Retention
**Maturity:** Alpha
**Status:** PLANNED
**Started:** 2026-03-20
**Completed:** TBD
**Duration Budget:** Single session (~3-4 hours)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| session-history | SPECCED | DONE | Agent-1 | ~2 hours | AC-001 through AC-010 passing, unit tests |
| quick-5 | SPECCED | DONE | Agent-1 | ~1.5 hours | AC-001 through AC-010 passing, unit tests |

## Dependencies & Serialization

```
session-history (first)
    ↓ (quick-5 depends on session-history for "quick-5" quizType)
quick-5 (second)
```

Single-threaded execution. Session history ships first because Quick 5 depends on the SessionRecord type and save function.

## Validation Criteria

### Per-Item Validation
- **session-history:** 10 ACs, localStorage persistence, collapsible UI, empty state, eviction at 11
- **quick-5:** 10 ACs, random type selection, same results flow, saves to history as "quick-5"

### Cycle Success Criteria
- [ ] All 20 ACs implemented and tested
- [ ] Unit tests cover localStorage read/write, eviction, personal best computation
- [ ] Unit tests cover random type selection, session save
- [ ] Full test suite passes (151+ existing tests, no regressions)
- [ ] Coverage remains >= 90%
- [ ] Deployed to staging via PR workflow

## Agent Autonomy & Checkpoints

Alpha: High autonomy. Single-session execution. Human available for questions. TDD cycle per feature.

## Notes

- Session history must ship first — Quick 5 depends on the SessionRecord type
- Both features are localStorage-only, no backend changes
- Quick 5 reuses existing quiz generators — main work is the random type selection and UI button
