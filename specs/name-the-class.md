# Feature Spec: Name the Class Quiz

**Status:** Approved
**Milestone:** M1 — MVP Quiz
**PRD Reference:** docs/prd.md §7 Feature 2

## Description

A multiple-choice quiz where the user is shown a generic drug name and must identify its pharmacological class (EPC) from four options. One option is correct, three are distractors.

## User Story

As a pharmacy student, I want to be quizzed on which pharmacological class a drug belongs to so that I can prepare for drug classification questions on my licensing exam.

## Acceptance Criteria

1. **Question display:** Shows a generic drug name prominently as the question
2. **Answer options:** Displays 4 EPC class names as clickable options
3. **One correct answer:** Exactly one option matches the drug's actual EPC class
4. **Distractor quality:** The 3 distractor classes are real EPC classes (not made up), and ideally not too similar to the correct answer
5. **Immediate feedback:** After selecting an answer, show correct/incorrect with the right answer highlighted
6. **Navigation:** "Next" button appears after answering to proceed to the next question
7. **Progress indicator:** Shows current question number out of total (e.g., "3 / 10")

## User Test Cases

1. User sees a drug name (e.g., "simvastatin") with 4 class options
2. User selects the correct class ("HMG-CoA Reductase Inhibitor") and sees a success indicator
3. User selects an incorrect class and sees the correct answer highlighted
4. User taps "Next" and a new question loads
5. After the last question, user is taken to the results screen

## Data Model

```typescript
interface MultipleChoiceQuestion {
  kind: "multiple-choice";
  drugName: string;
  correctAnswer: string;
  options: string[];  // 4 items, shuffled, one is correctAnswer
}
```

## API Contract

Question generation follows the "Name the Class" recipe from `frontend-api-contract.md`:

1. `GET /v1/drugs/names?type=generic&limit=1&page={random}` — pick a random generic drug
2. `GET /v1/drugs/class?name={drug_name}` — get the correct EPC class
3. `GET /v1/drugs/classes?type=epc&limit=3&page={random}` — get 3 distractor classes

**Retry logic:** If step 2 returns 404 (drug has no class data), skip and pick another drug. If step 3 returns a distractor that matches the correct answer, re-fetch.

**Randomization:** Use `pagination.total_pages` from an initial call to determine valid random page ranges.

## Edge Cases

- Drug has no EPC class (404 from class lookup) — skip, pick another drug
- Distractor class duplicates the correct answer — re-fetch or filter
- API rate limit hit (429) — show error, pause generation, respect `Retry-After`
- API unavailable (502) — show error message, offer retry
- Very long class names — ensure text doesn't overflow on mobile

## Screenshot Checkpoints

1. Question displayed with 4 options (unanswered state)
2. Correct answer selected — success feedback
3. Incorrect answer selected — error feedback with correct answer shown
4. Mobile viewport
