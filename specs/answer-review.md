# Spec: Answer Review Mode

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Complete

## 1. Overview

Show correct answers with drug class context both inline (after each question) and as a summary review screen after the quiz. This transforms the quiz from a test into a learning tool — the user understands *why* they got something wrong, not just *that* they got it wrong.

### User Story

As a pharmacy student, I want to see the correct answer and drug class context after each question so that I learn from my mistakes during the quiz and can review all answers at the end.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | After answering a multiple-choice question, an inline feedback banner shows whether the answer was correct or incorrect, with the drug name and its correct class | Must |
| AC-002 | After submitting a matching question, incorrect pairs are highlighted and the correct pairings are shown | Must |
| AC-003 | Inline feedback for correct answers shows a green banner: "{DrugName} is a {ClassName}" | Must |
| AC-004 | Inline feedback for incorrect answers shows a red banner: "Incorrect — {DrugName} belongs to {ClassName}" | Must |
| AC-005 | The results screen includes a "Review Answers" section below the score showing all questions with correct answers | Must |
| AC-006 | Each review entry shows: question number, question type icon, the drug(s) involved, user's answer, correct answer, and correct/incorrect status | Must |
| AC-007 | The review section is collapsible, expanded by default | Must |
| AC-008 | Answer data (question + user response + correct answer) is stored in the session state so the results screen can display it | Must |
| AC-009 | The existing QuizResults score display, breakdown circles, and buttons (Retry, New Quiz) remain unchanged | Must |
| AC-010 | Inline feedback does not block the "Next Question" / "See Results" button — both are visible simultaneously | Must |

## 3. User Test Cases

### TC-001: Correct multiple-choice answer shows green feedback

**Precondition:** In a Name the Class quiz
**Steps:**
1. Answer a question correctly
**Expected Result:** Green banner appears: "Simvastatin is a HMG-CoA Reductase Inhibitor" (example). Next Question button visible below.
**Screenshot Checkpoint:** tests/screenshots/answer-review/step-01-correct-mc.png
**Maps to:** AC-001, AC-003, AC-010

### TC-002: Incorrect multiple-choice answer shows red feedback

**Precondition:** In a Name the Class quiz
**Steps:**
1. Answer a question incorrectly
**Expected Result:** Red banner: "Incorrect — Simvastatin belongs to HMG-CoA Reductase Inhibitors". The selected wrong option is highlighted red, the correct option is highlighted green. Next Question button visible.
**Screenshot Checkpoint:** tests/screenshots/answer-review/step-02-incorrect-mc.png
**Maps to:** AC-001, AC-004, AC-010

### TC-003: Matching question shows correct pairs after submission

**Precondition:** In a Match Drug to Class quiz
**Steps:**
1. Match all 4 pairs (some incorrectly)
2. Submit
**Expected Result:** Incorrect pairs highlighted. Correct pairings shown. Existing color-coded pair behavior preserved.
**Screenshot Checkpoint:** tests/screenshots/answer-review/step-03-matching-feedback.png
**Maps to:** AC-002

### TC-004: Results screen shows full answer review

**Precondition:** Complete a 5-question quiz with mixed results
**Steps:**
1. Complete quiz
2. View results screen
**Expected Result:** Below the score and breakdown circles, a "Review Answers" section shows all 5 questions with drug names, user answers, correct answers, and correct/incorrect indicators.
**Screenshot Checkpoint:** tests/screenshots/answer-review/step-04-results-review.png
**Maps to:** AC-005, AC-006, AC-007

## 4. Data Model

### AnswerDetail (extends existing Answer)

The existing `Answer` type (`{ questionIndex, correct }`) must be extended to carry review data:

```typescript
interface AnswerDetail {
  questionIndex: number;
  correct: boolean;
  /** The question that was asked (for review) */
  question: Question;
  /** User's selected answer (option string for MC, pairs for matching) */
  userAnswer: string | Record<string, string>;
}
```

### QuizResults (extended)

```typescript
interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: AnswerDetail[];  // Changed from Answer[] to AnswerDetail[]
}
```

### localStorage Impact

No new localStorage keys. Answer details live in session state only (not persisted — session history already captures the score).

## 5. API Contract

N/A — no new API calls. All review data comes from the question objects already fetched.

## 6. UI Behavior

### Inline Feedback (Multiple Choice)

Appears after answer selection, between the options and the Next button:

```
┌──────────────────────────────────────┐
│  ✓ Simvastatin is a                  │
│    HMG-CoA Reductase Inhibitor       │
└──────────────────────────────────────┘
```

or

```
┌──────────────────────────────────────┐
│  ✗ Incorrect — Simvastatin belongs   │
│    to HMG-CoA Reductase Inhibitors   │
└──────────────────────────────────────┘
```

### Inline Feedback (Matching)

The existing MatchingQuiz already shows correct pairs with color coding after submission. No changes needed — AC-002 is already satisfied by current behavior.

### Results Review Section

Below existing breakdown circles, above Retry/New Quiz buttons:

```
Review Answers  ▼
──────────────────
1. ✓ Simvastatin → HMG-CoA Reductase Inhibitor
2. ✗ Lisinopril → You said: Beta Blocker | Correct: ACE Inhibitor
3. ✓ Match Drug to Class — 4/4 correct
4. ✗ Match Drug to Class — 3/4 correct
   Missed: Metformin → Biguanide
5. ✓ Atorvastatin → Lipitor
```

### States

- **Inline correct:** Green background, checkmark icon
- **Inline incorrect:** Red background, X icon, shows correct answer
- **Review expanded:** Full list visible
- **Review collapsed:** "Review Answers ▶" header only

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Correct MC inline feedback | tests/screenshots/answer-review/step-01-correct.png |
| 2 | Incorrect MC inline feedback | tests/screenshots/answer-review/step-02-incorrect.png |
| 3 | Results with review section | tests/screenshots/answer-review/step-03-review.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| All answers correct | Review section still shows, all green. Positive reinforcement. |
| All answers incorrect | Review section shows all items with correct answers. Learning opportunity. |
| Quick 5 mixed types | Review shows correct type icon per question (MC vs matching) |
| Very long class names | Truncate with ellipsis at 60 chars, full name in title tooltip |

## 8. Dependencies

- Existing MultipleChoice component (add inline feedback banner)
- Existing MatchingQuiz component (already has post-submit feedback — verify AC-002)
- Existing QuizResults component (add review section)
- Types: `Answer` → `AnswerDetail` migration (must be backward compatible with session history)
- `useQuizSession` hook must capture question + user answer data

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from /add:cycle interview |
