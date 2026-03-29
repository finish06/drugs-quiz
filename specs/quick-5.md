# Spec: Quick 5 Entry Point

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Complete

## 1. Overview

Add a prominent "Quick 5" button to the home screen that launches a 5-question quiz with randomly selected quiz types. Lowers the activation energy for short study sessions by reducing the config screen to a single tap.

### User Story

As a pharmacy student between classes, I want to start a quick quiz with one tap so that I can fit a short study session into a 5-minute break.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "Quick 5" button appears above the quiz type selector on the home screen | Must |
| AC-002 | The button is visually distinct: brand accent color with a lightning bolt icon | Must |
| AC-003 | Tapping Quick 5 immediately starts a 5-question quiz session (no config step) | Must |
| AC-004 | Each of the 5 questions independently picks a random quiz type (name-the-class, match-drug-to-class, or brand-generic-match) | Must |
| AC-005 | The quiz session uses the same question generation, scoring, and results flow as a normal quiz | Must |
| AC-006 | Quick 5 sessions are saved to session history with quizType "quick-5" | Must |
| AC-007 | Quick 5 sessions count toward personal best tracking (tracked as its own quiz type) | Must |
| AC-008 | The results screen after Quick 5 shows the same information as a normal quiz | Must |
| AC-009 | Quick 5 works correctly with the existing lazy-load question mechanism | Must |
| AC-010 | The button label and icon are accessible (proper aria-label, sufficient contrast) | Should |

## 3. User Test Cases

### TC-001: Quick 5 launches immediately

**Precondition:** App is on the home screen
**Steps:**
1. Tap the "Quick 5" button
2. Observe the quiz starts immediately
**Expected Result:** Quiz begins with question 1 of 5. No config screen shown. Question type may be multiple choice or matching.
**Screenshot Checkpoint:** tests/screenshots/quick-5/step-01-launch.png
**Maps to:** TBD

### TC-002: Mixed quiz types in one session

**Precondition:** Quick 5 session started
**Steps:**
1. Answer all 5 questions
2. Observe the quiz types presented
**Expected Result:** Questions are a random mix of the 3 quiz types. Not all questions need to be different types, but types are randomly selected.
**Screenshot Checkpoint:** tests/screenshots/quick-5/step-02-mixed-types.png
**Maps to:** TBD

### TC-003: Quick 5 saves to session history

**Precondition:** Session history feature is active
**Steps:**
1. Complete a Quick 5 session scoring 3/5
2. Return to home screen
**Expected Result:** Session history shows a new entry: "Quick 5 — 3/5 (60%)"
**Screenshot Checkpoint:** tests/screenshots/quick-5/step-03-history.png
**Maps to:** TBD

### TC-004: Quick 5 button is visually prominent

**Precondition:** App is on the home screen
**Steps:**
1. Observe the home screen layout
**Expected Result:** Quick 5 button is above the quiz type selector, uses brand accent color (#3b82f6), includes a lightning bolt icon, and is the most visually prominent action on the page.
**Screenshot Checkpoint:** tests/screenshots/quick-5/step-04-button-design.png
**Maps to:** TBD

## 4. Data Model

No new data entities. Quick 5 reuses the existing quiz session model. The `quizType` field in SessionRecord accepts "quick-5" as a value (added by the session-history spec).

### Quiz Generation

Quick 5 generates questions by:
1. For each of 5 questions, randomly select a quiz type
2. Call the corresponding generator function (same as normal quiz)
3. Deduplicate drugs across all 5 questions (shared `usedDrugs` set)

## 5. API Contract

N/A — reuses existing drug-gate API calls via the existing generators.

## 6. UI Behavior

### States

- **Default:** Quick 5 button displayed prominently above quiz config
- **Loading:** Same loading state as normal quiz (lazy-load first 2 questions)
- **In Quiz:** Standard quiz flow — may alternate between MultipleChoice and MatchingQuiz components based on random type selection
- **Results:** Standard results screen

### Button Design

- Background: Brand accent (#3b82f6)
- Text: White, bold
- Icon: Lightning bolt (SVG inline)
- Size: Full width, larger padding than normal buttons
- Position: Above the quiz type selector, below the header
- Hover/active states consistent with existing button styles
- Dark mode: Same accent color, adjusted for dark background

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Home screen with Quick 5 button | tests/screenshots/quick-5/step-01-home.png |
| 2 | Mid-quiz with mixed types | tests/screenshots/quick-5/step-02-quiz.png |
| 3 | Results after Quick 5 | tests/screenshots/quick-5/step-03-results.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| All 5 questions randomly pick the same type | Valid — random means random. No forced diversity. |
| Question generation fails for one type | Fall back to a different type for that question. If all fail, show error. |
| User exits mid-quiz | Same behavior as normal quiz — session is not saved. |
| Quick 5 with lazy loading | First 2 questions load immediately, remaining 3 in background (same as normal quiz) |

## 8. Dependencies

- Session History spec (for "quick-5" quizType in SessionRecord)
- Existing quiz generators (generateNameTheClassQuestion, generateMatchDrugToClassQuestion, generateBrandGenericMatchQuestion)
- Existing useQuizSession hook

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
