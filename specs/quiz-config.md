# Feature Spec: Quiz Configuration

**Status:** Complete
**Milestone:** M1 — MVP Quiz
**PRD Reference:** docs/prd.md §7 Feature 5

## Description

The quiz configuration screen is the home/landing page of the app. Users select a quiz type and number of questions, then start a session. This is the entry point for all quiz interactions.

## User Story

As a pharmacy student, I want to choose a quiz type and configure the number of questions so that I can tailor my study session to what I need to practice.

## Acceptance Criteria

1. **Quiz type selection:** User can select one of three quiz types:
   - "Name the Class" — multiple choice
   - "Match Drug to Class" — matching exercise
   - "Brand/Generic Match" — matching exercise
2. **Question count:** User can select number of questions (5, 10, 15, 20)
3. **Start button:** User can start a quiz session with the selected configuration
4. **Default state:** "Name the Class" is selected by default, 10 questions
5. **Validation:** Start button is enabled only when a quiz type is selected

## User Test Cases

1. User opens the app and sees three quiz type options with "Name the Class" pre-selected
2. User taps "Match Drug to Class" and sees it highlighted as selected
3. User changes question count from 10 to 20
4. User taps "Start Quiz" and is taken to the quiz session screen
5. On mobile, the layout is single-column and all options are easily tappable

## Data Model

```typescript
interface QuizConfig {
  type: "name-the-class" | "match-drug-to-class" | "brand-generic-match";
  questionCount: 5 | 10 | 15 | 20;
}
```

No API calls are made on this screen — it's purely local state.

## API Contract

None — this screen does not interact with the API.

## Edge Cases

- Deep link to a specific quiz type (future consideration)
- Browser back button returns to config from an active session

## Screenshot Checkpoints

1. Default state — home screen with default selections
2. Alternative selection — different quiz type and question count selected
3. Mobile viewport — responsive layout
