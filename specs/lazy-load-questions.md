# Spec: Lazy Load Questions

**Version:** 0.1.0
**Created:** 2026-03-16
**PRD Reference:** docs/prd.md §7 Feature 4 (Quiz Session)
**Status:** Complete

## 1. Overview

Generate quiz questions progressively — load the first 2 immediately, present the quiz as soon as they're ready, then continue generating remaining questions in the background while the user answers. This eliminates the 10-15 second upfront wait for matching quizzes.

### User Story

As a pharmacy student, I want the quiz to start as soon as possible so that I'm not staring at a loading spinner for 15 seconds before I can start studying.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Quiz starts as soon as the first 2 questions are generated, not after all questions | Must |
| AC-002 | Remaining questions generate in the background while the user answers | Must |
| AC-003 | If user reaches a question that hasn't loaded yet, show a brief inline loading spinner | Must |
| AC-004 | Progress indicator shows "Loading question X of Y..." only during the initial 2-question load | Must |
| AC-005 | All questions are still deduplicated (usedDrugs set shared across foreground + background generation) | Must |
| AC-006 | If a background question fails to generate, retry once before showing an error | Should |
| AC-007 | The total question count displayed (e.g., "Question 1 of 10") uses the configured count from the start, not the number loaded so far | Must |

## 3. User Test Cases

### TC-001: Quiz starts after 2 questions load

**Precondition:** User on config screen, 10 questions selected.
**Steps:**
1. Click "Start Quiz"
2. Wait for loading
**Expected Result:** Quiz presents question 1 within ~3-5 seconds (2 questions loaded), not 15+ seconds (all 10). Shows "Question 1 of 10".
**Screenshot Checkpoint:** N/A (timing-based)
**Maps to:** TBD

### TC-002: Background loading completes seamlessly

**Precondition:** Quiz started, answering question 1.
**Steps:**
1. Answer question 1
2. Click "Next Question"
3. Continue through all 10 questions
**Expected Result:** No loading spinner appears between questions (background generation finishes before user catches up).
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-003: User catches up to background loading

**Precondition:** Quiz started, user answers very quickly.
**Steps:**
1. Answer questions 1 and 2 rapidly (within 2 seconds each)
2. Click "Next Question" to reach question 3
**Expected Result:** If question 3 isn't ready, a brief inline spinner appears ("Loading next question..."). Quiz resumes automatically when the question is ready.
**Screenshot Checkpoint:** tests/screenshots/lazy-load/tc-003-inline-spinner.png
**Maps to:** TBD

### TC-004: All questions complete normally

**Precondition:** Quiz with 5 questions, lazy loaded.
**Steps:**
1. Complete all 5 questions
**Expected Result:** Results screen shows correct score for all 5 questions. No missing questions.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

## 4. Data Model

### Changes to QuizSession state

```typescript
interface QuizSession {
  config: QuizConfig;
  questions: Question[];       // grows as background generation adds questions
  answers: Answer[];
  currentIndex: number;
  status: "loading" | "in-progress" | "complete";
  generationComplete: boolean; // true when all questions have been generated
}
```

No API or localStorage changes needed.

## 5. API Contract

N/A — no API changes. The existing `generateQuestions` function needs to be split into a streaming/callback pattern.

## 6. UI Behavior

### States

- **Initial loading:** Spinner with "Loading question 1 of 10..." → "Loading question 2 of 10..." (first 2 questions)
- **In-progress (question ready):** Normal quiz question display
- **In-progress (waiting for background):** Inline spinner: "Loading next question..." (rare — only if user is faster than generation)
- **Complete:** Normal results screen

### Implementation Approach

1. Split `generateQuestions` into a generator that yields questions one at a time (or use a callback pattern)
2. `useQuizSession` generates first 2 questions, then sets status to "in-progress"
3. Background generation continues via `useEffect` or a ref-based approach
4. When user calls `nextQuestion()` and the question isn't ready, show inline loading
5. Questions array grows as background generation appends to it

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| All questions fail after first 2 | Show error after the last successfully loaded question, offer to end quiz early with partial results |
| User exits during background loading | Background generation is cancelled (cleanup) |
| Only 1-2 questions requested | No background loading needed — generate all upfront |
| Background generation throws repeatedly | After 1 retry per question, skip that question and reduce total count |

## 8. Dependencies

- Modifies `generateQuestions` in `src/services/quiz-generators.ts` (add streaming/callback support)
- Modifies `useQuizSession` hook (progressive loading state)
- Modifies `App.tsx` (inline loading spinner between questions)
- Must maintain compatibility with existing `onProgress` callback

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-16 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
