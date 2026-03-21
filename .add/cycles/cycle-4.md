# Cycle 4 — Answer Review + Spaced Repetition

**Milestone:** M3 — Learning Loop & Retention
**Maturity:** Alpha
**Status:** COMPLETE
**Started:** 2026-03-20
**Completed:** 2026-03-20
**Duration Budget:** Single session (~4-5 hours)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| answer-review | SHAPED | DONE | Agent-1 | ~2 hours | AC-001 through AC-010 passing, unit tests |
| spaced-repetition | SHAPED | DONE | Agent-1 | ~2.5 hours | AC-001 through AC-012 passing, unit tests |

## Dependencies & Serialization

```
answer-review (first)
    ↓ (spaced-repetition depends on AnswerDetail type for drug-level tracking)
spaced-repetition (second)
```

Single-threaded execution. Answer review ships first because:
1. It introduces the `AnswerDetail` type that carries question + drug data
2. Spaced repetition needs drug-level correct/incorrect data from `AnswerDetail` to update performance records
3. The `useQuizSession` hook changes (capturing answer details) must be stable before SR layers on top

## Validation Criteria

### Per-Item Validation
- **answer-review:** 10 ACs — inline feedback banners (MC + matching), results review section, AnswerDetail type migration, no regression in existing quiz flow
- **spaced-repetition:** 12 ACs — localStorage drug tracking, weighted generator selection, decay on correct, flashcard drill, Study Weak Drugs button, 200-drug cap with eviction

### Cycle Success Criteria
- [x] All 22 ACs implemented and tested (21 Must + 1 Should deferred)
- [x] AnswerDetail type replaces Answer without breaking existing session history
- [x] Quiz generators accept optional WeightMap for biased selection
- [x] Flashcard drill cycles weak drugs until user exits
- [x] Full test suite passes (214 tests, no regressions)
- [x] Coverage remains >= 90% (94.1% stmts, 87.3% branches)
- [x] M3 milestone success criteria fully met (8/9, pending staging deploy)

## Agent Autonomy & Checkpoints

Alpha: High autonomy. Single-session execution. Human available for questions. TDD cycle per feature.

## Notes

- answer-review is lower risk — mostly UI additions (inline feedback + results review section)
- spaced-repetition is higher risk — touches quiz generators (shared infrastructure) and introduces weighted selection
- The flashcard drill is a new screen/mode — needs its own component
- Matching questions track each drug individually (4 drugs per matching question = 4 performance updates)
- WeightMap is a soft bias — if no weak drugs are in the fetched class, falls back to normal random. This preserves existing generator architecture.
- After this cycle, M3 should be complete (all 4 features DONE)
