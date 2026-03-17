# Implementation Plan: Lazy Load Questions

**Spec Version:** 0.1.0
**Created:** 2026-03-16
**Team Size:** Solo
**Estimated Duration:** 2-3 hours

## Overview

Replace the all-at-once question generation with progressive loading: generate 2 questions first, start the quiz, then generate remaining questions in the background. Users see the quiz in ~3-5 seconds instead of 15+.

## Approach

1. Add a `generateSingleQuestion` export to quiz-generators.ts that generates one question given a class pool and usedDrugs set
2. Rewrite `useQuizSession` to generate 2 questions initially, set status to "in-progress", then continue generating in the background
3. Add a "waiting for question" state in App.tsx when user is ahead of background generation

The key insight: `generateQuestions` already generates sequentially — we just need to split the loop: first 2 upfront, rest in background.

## Implementation Phases

### Phase 1: Quiz Generator — Single Question Export (~20 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-001 | Export `generateSingleQuestion(type, classPool, usedDrugs)` from quiz-generators.ts — extracts the per-question logic from generateQuestions | 10min | AC-005 |
| TASK-002 | Refactor `generateQuestions` to use `generateSingleQuestion` internally (no behavior change) | 5min | AC-005 |
| TASK-003 | Write test verifying `generateSingleQuestion` returns a valid question and updates usedDrugs | 5min | AC-005 |

### Phase 2: useQuizSession — Progressive Loading (~45 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-004 | Add `generationComplete` boolean to QuizSession type in types/quiz.ts | 5min | AC-002 |
| TASK-005 | Rewrite `startQuiz` in useQuizSession: generate first 2 questions, set status "in-progress", then kick off background generation | 20min | AC-001, AC-002 |
| TASK-006 | Background generation: use a ref + async function that appends questions to session state one at a time, sets `generationComplete: true` when done | 10min | AC-002 |
| TASK-007 | Handle cancellation: if `resetQuiz` is called during background generation, abort via ref flag | 5min | Edge case |
| TASK-008 | Handle ≤2 questions: if count ≤ 2, skip background generation entirely | 5min | Edge case |
| TASK-009 | Write tests: quiz starts after 2 questions, background adds remaining, cancellation works, ≤2 questions works | 15min | AC-001, AC-002 |

### Phase 3: App.tsx — Inline Loading State (~20 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-010 | Detect "waiting for question" state: `currentIndex >= questions.length && !generationComplete` | 5min | AC-003 |
| TASK-011 | Render inline spinner with "Loading next question..." when waiting | 5min | AC-003 |
| TASK-012 | Keep total question count from config (not questions.length) for "Question X of Y" | 5min | AC-007 |
| TASK-013 | Update progress indicator to only show during initial 2-question load | 5min | AC-004 |
| TASK-014 | Update App.test.tsx for new loading behavior | 10min | AC-001, AC-003 |

### Phase 4: Verify (~15 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-015 | Run full test suite + coverage | 5min | All |
| TASK-016 | Run E2E test against staging | 5min | All |
| TASK-017 | Commit and push | 5min | — |

## Effort Summary

| Phase | Estimated | Tasks |
|-------|-----------|-------|
| Phase 1: Generator refactor | 20 min | 3 |
| Phase 2: Progressive hook | 60 min | 6 |
| Phase 3: UI updates | 30 min | 5 |
| Phase 4: Verify | 15 min | 3 |
| **Total** | **~2 hours** | **17** |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Race condition between background gen and user navigation | Medium | High | Use refs for cancellation, never mutate state directly |
| React state batching delays question availability | Low | Medium | Use functional setState to always read latest state |
| Background generation error crashes the quiz | Medium | Medium | Catch per-question, retry once, skip on second failure |

## Key Implementation Details

### useQuizSession rewrite (conceptual)

```typescript
const startQuiz = async (config) => {
  const classPool = await fetchEpcClassPool();
  const usedDrugs = new Set<string>();

  // Generate first 2 questions
  const initial = [];
  for (let i = 0; i < Math.min(2, config.questionCount); i++) {
    const q = await generateSingleQuestion(config.type, classPool, usedDrugs);
    initial.push(q);
    onProgress?.(i + 1, config.questionCount);
  }

  // Start quiz immediately
  setSession({ ...config, questions: initial, status: "in-progress", generationComplete: config.questionCount <= 2 });

  // Background: generate remaining
  if (config.questionCount > 2) {
    backgroundGenerate(config, classPool, usedDrugs, 2);
  }
};
```

### "Waiting" state detection in App.tsx

```typescript
// User is on a question that hasn't loaded yet
const isWaitingForQuestion =
  session.status === "in-progress" &&
  session.currentIndex >= session.questions.length &&
  !session.generationComplete;
```

## Deliverables

### Files Modified
- `src/types/quiz.ts` — add `generationComplete` to QuizSession
- `src/services/quiz-generators.ts` — export `generateSingleQuestion`
- `src/hooks/useQuizSession.ts` — progressive loading logic
- `src/App.tsx` — inline waiting state
- Tests for all of the above

## Plan History

| Date | Changes |
|------|---------|
| 2026-03-16 | Initial plan created |
