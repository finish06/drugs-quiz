# Milestone M7 — Study Experience

**Goal:** Turn Rx Drill from a quiz app into a focused study tool. Help users see their progress, celebrate wins, and control what they study.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** SHAPED
**Started:** TBD
**Completed:** TBD

## Hill Chart

```
workflow-dispatch      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — manual release trigger
e2e-prod-smoke         ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — scheduled E2E smoke tests
share-dark-mode-verify ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — verify + fix share page dark mode
keyboard-hints         ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — first-visit shortcut hint overlay
quiz-confetti          ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — celebration animation for 100% scores
progress-dashboard     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — personal analytics
achievements-badges    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — streaks, mastery, first 100%
custom-quiz            ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — pick specific drug classes
naplex-ptce-mode       ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — exam blueprint weighting
```

## Feature Details

| Feature | Spec | Position | Cycle | Notes |
|---------|------|----------|-------|-------|
| workflow-dispatch | TBD | SHAPED | 12 | Add `workflow_dispatch` trigger to release.yml for manual hotfix redeploys |
| e2e-prod-smoke | TBD | SHAPED | 12 | Scheduled Playwright tests against rxdrill.com (health, OAuth, quiz flow) |
| share-dark-mode-verify | TBD | SHAPED | 12 | Confirm `prefers-color-scheme` works on /s/:token pages |
| keyboard-hints | TBD | SHAPED | 12 | First-visit overlay showing 1-4 answer, Enter continue, Esc exit |
| quiz-confetti | TBD | SHAPED | 12 | Canvas confetti animation on 100% quiz completion |
| progress-dashboard | TBD | SHAPED | 13 | Accuracy trends over time, weak drug classes, time-per-question, streak count |
| achievements-badges | TBD | SHAPED | 13 | Badges: first 100%, 7-day streak, class mastery (100% on all drugs in a class), 100 questions answered, etc. |
| custom-quiz | TBD | SHAPED | 14 | Let users select specific drug classes to quiz on (multi-select UI, API param) |
| naplex-ptce-mode | TBD | SHAPED | 15 | Quiz generator weighted by NAPLEX/PTCE exam blueprint percentages |

## Success Criteria

- [ ] Progress dashboard shows accuracy trends and weak areas for authenticated users
- [ ] At least 5 achievement badges implemented and earnable
- [ ] Users can create a custom quiz from any subset of drug classes
- [ ] NAPLEX mode generates questions weighted by exam blueprint
- [ ] Confetti animation delights users on 100% scores
- [ ] Keyboard shortcut hints appear for first-time users
- [ ] Share pages render correctly in both light and dark mode
- [ ] E2E smoke tests run daily against production
- [ ] Manual workflow dispatch available for hotfix releases
- [ ] Test coverage remains ≥ 78% branches
- [ ] No regression in existing test suite

## Dependencies

- M5 complete (accounts, cloud sessions) ✅
- M6 not a blocker — M7 can ship in parallel or before
- Drug class metadata (already available via drug-gate API)
- NAPLEX/PTCE blueprint percentages — needs research

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| NAPLEX blueprint availability | Medium | Medium | If official blueprint is gated, use public approximation and note it in UI |
| Progress dashboard query performance | Low | Low | Postgres indexes on user_id + completed_at |
| Achievement tracking across devices | Low | Medium | Store in DB for authenticated users; localStorage fallback for guests |
| Custom quiz generator complexity | Medium | Low | Start with simple "class include list" param; expand later |

## Proposed Cycle Plan

### Cycle 12 — Polish & Ops (~1 day)
Quick wins with low risk and high momentum.
- workflow-dispatch
- e2e-prod-smoke
- share-dark-mode-verify
- keyboard-hints
- quiz-confetti

### Cycle 13 — Study Insights (~3 days)
Leverage existing quiz_sessions data.
- progress-dashboard
- achievements-badges

### Cycle 14 — Custom Study (~2 days)
Foundation for flexible quiz generation.
- custom-quiz

### Cycle 15 — Exam Prep Mode (~4 days)
Builds on custom-quiz generator.
- naplex-ptce-mode

## Strategic Rationale

**Quick wins first.** Cycle 12 is 5 small features that deploy in a day. Builds confidence in the CI/CD pipeline without risk.

**Insights before customization.** Users need to know what they're bad at before they can meaningfully pick what to study. Progress dashboard and badges must come before custom quiz.

**Custom quiz is foundational.** NAPLEX mode is essentially "custom quiz with smart defaults." Building custom quiz first gives us the plumbing for free.

**M7 runs parallel to M6.** M6 is about competitive/native features. M7 is about study depth. They don't depend on each other — whichever we feel like tackling next.
