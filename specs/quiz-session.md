# Feature Spec: Quiz Session

**Status:** Complete
**Milestone:** M1 — MVP Quiz
**PRD Reference:** docs/prd.md §7 Feature 4

## Description

The quiz session manages the overall flow of a quiz: generating questions based on the selected configuration, tracking answers, showing progress, and displaying results at the end. It orchestrates the individual quiz type components.

## User Story

As a pharmacy student, I want a smooth quiz flow from start to finish with scoring and a results summary so that I can measure my knowledge and track how I did in each session.

## Acceptance Criteria

1. **Loading state:** Shows a loading indicator while questions are being generated from the API
2. **Question flow:** Presents questions one at a time in sequence
3. **Progress bar:** Visual progress indicator showing completion (e.g., "Question 3 of 10")
4. **Answer tracking:** Records whether each answer was correct or incorrect
5. **No going back:** Once a question is answered and "Next" is tapped, the user cannot return to it
6. **Results screen:** After the last question, displays:
   - Total correct / total questions
   - Percentage score
   - Per-question breakdown (which were correct/incorrect)
7. **Restart:** From results, user can start a new quiz (returns to config) or retry the same config
8. **Error handling:** If API errors occur during question generation, show an error with retry option
9. **Loading progress:** Shows "Loading question X of Y..." as each question generates

## User Test Cases

1. User starts a 10-question "Name the Class" quiz — sees loading, then first question
2. User answers all 10 questions — progress bar fills as they go
3. After question 10, results screen shows "7 / 10 correct (70%)"
4. User taps "New Quiz" and returns to the config screen
5. User taps "Retry" and starts the same quiz type with fresh questions
6. API error during loading — error message with "Retry" button

## Data Model

```typescript
interface QuizSession {
  config: QuizConfig;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  status: "loading" | "in-progress" | "complete";
}

interface Answer {
  questionIndex: number;
  correct: boolean;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: Answer[];
}
```

## API Contract

The session itself does not make API calls directly. It delegates question generation to quiz-type-specific generators that use the API client:

- `generateNameTheClassQuestions(count)` — uses Name the Class recipe
- `generateMatchDrugToClassQuestions(count)` — uses Match Drug to Class recipe
- `generateBrandGenericMatchQuestions(count)` — uses Brand/Generic Match recipe

Each generator returns `Promise<Question[]>`.

## Edge Cases

- API fails during question generation — show error, offer retry, don't show partial quiz
- All questions generated but one fails — retry that single question, don't fail the whole batch
- User closes tab mid-quiz — session is lost (localStorage persistence is out of scope for M1)
- Very slow API — show loading with a message after 5 seconds ("Still loading...")
- User navigates away via browser back — confirm before abandoning session

## Screenshot Checkpoints

1. Loading state — spinner/skeleton while questions generate, with progress indicator ("Loading question X of Y...")
2. In-progress — question displayed with progress bar
3. Results — final score with breakdown
4. Error state — API error with retry button
5. Mobile viewport — all states
