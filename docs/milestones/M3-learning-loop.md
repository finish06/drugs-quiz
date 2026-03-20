# Milestone M3 — Learning Loop & Retention

**Goal:** Transform the quiz from a test into a study tool. Give users a reason to come back tomorrow via feedback loops, progress awareness, and low-friction entry points.
**Appetite:** 2-3 weeks
**Target Maturity:** Alpha
**Status:** IN_PROGRESS
**Started:** 2026-03-20

## Hill Chart

```
session-history      ████████████░░░░░░░░░░░░░░░░░░░░░░░░  SPECCED — spec complete, ready for TDD
quick-5              ████████████░░░░░░░░░░░░░░░░░░░░░░░░  SPECCED — spec complete, depends on session-history
answer-review        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — planned for cycle 4
spaced-repetition    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — planned for cycle 4
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| session-history | specs/session-history.md | SPECCED | localStorage session tracking + personal best |
| quick-5 | specs/quick-5.md | SPECCED | One-tap 5-question mixed quiz |
| answer-review | TBD | SHAPED | Post-quiz review with correct answers (cycle 4) |
| spaced-repetition | TBD | SHAPED | Track weak drugs, surface them more often (cycle 4) |

## Success Criteria

- [ ] Session history saves and displays last 10 sessions
- [ ] Personal best tracked per quiz type
- [ ] Quick 5 launches in one tap with mixed quiz types
- [ ] Answer review shows correct answers after quiz (cycle 4)
- [ ] Spaced repetition surfaces weak drugs (cycle 4)
- [ ] All features localStorage-based, no backend required
- [ ] Unit tests cover all ACs
- [ ] No regression in existing 151 tests
- [ ] Deployed to staging

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
