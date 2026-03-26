# Spec: Share Quiz Results

**Version:** 0.1.0
**Created:** 2026-03-26
**PRD Reference:** docs/prd.md
**Status:** Draft

## 1. Overview

Add a "Share Results" button to the QuizResults screen that copies a formatted text summary of the quiz score to the clipboard. On mobile devices that support the Web Share API, the button uses `navigator.share()` for native sharing; otherwise it falls back to clipboard copy via `navigator.clipboard`. A brief "Copied!" toast confirms the action. No server-side component or social media integration is needed.

### User Story

As a pharmacy student, I want to share my quiz results with classmates so that we can compare scores and motivate each other to study.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "Share Results" button appears on the QuizResults screen below the score breakdown | Must |
| AC-002 | Clicking the button copies a formatted text string to the clipboard | Must |
| AC-003 | The copied text follows the format: `🎯 Rx Quiz: Scored {percentage}% on {quiz-type-label} ({correct}/{total}) — drug-quiz.calebdunn.tech` | Must |
| AC-004 | The quiz type label is human-readable: "Name the Class", "Match Drug to Class", "Brand/Generic Match", or "Quick 5" | Must |
| AC-005 | After a successful copy, a "Copied!" feedback indicator appears near the button for 2 seconds, then fades | Must |
| AC-006 | On devices where `navigator.share` is available, clicking the button invokes the native share sheet with the formatted text | Should |
| AC-007 | If `navigator.share()` is called but the user cancels the share sheet, no error is shown | Must |
| AC-008 | If `navigator.share` is unavailable, the button falls back to `navigator.clipboard.writeText()` | Must |
| AC-009 | If both `navigator.share` and `navigator.clipboard` are unavailable (e.g., insecure context), the button is hidden | Should |
| AC-010 | The button has an appropriate icon (share or clipboard icon) and is styled consistently with existing action buttons on the results screen | Must |
| AC-011 | The button works correctly in both light and dark mode | Must |
| AC-012 | The button has an accessible label (aria-label or visible text) | Should |

## 3. User Test Cases

### TC-001: Share copies to clipboard (desktop)

**Precondition:** Quiz completed, results screen visible, desktop browser (no Web Share API)
**Steps:**
1. Complete a 10-question Name the Class quiz scoring 8/10
2. Click the "Share Results" button
**Expected Result:** Clipboard contains `🎯 Rx Quiz: Scored 80% on Name the Class (8/10) — drug-quiz.calebdunn.tech`. A "Copied!" indicator appears near the button and disappears after ~2 seconds.
**Screenshot Checkpoint:** tests/screenshots/share-results/step-01-copied-feedback.png
**Maps to:** AC-002, AC-003, AC-004, AC-005

### TC-002: Share uses native share sheet on mobile

**Precondition:** Quiz completed, results screen visible, mobile device with Web Share API
**Steps:**
1. Complete a Quick 5 quiz scoring 4/5
2. Tap the "Share Results" button
**Expected Result:** The device's native share sheet opens with the text `🎯 Rx Quiz: Scored 80% on Quick 5 (4/5) — drug-quiz.calebdunn.tech`.
**Screenshot Checkpoint:** tests/screenshots/share-results/step-02-native-share.png
**Maps to:** AC-006, AC-003, AC-004

### TC-003: Cancelling native share shows no error

**Precondition:** Native share sheet is open (TC-002 in progress)
**Steps:**
1. Dismiss/cancel the native share sheet
**Expected Result:** No error toast or message appears. The results screen remains in its normal state.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-007

### TC-004: Share button visible across quiz types

**Precondition:** Results screen visible
**Steps:**
1. Complete a Match Drug to Class quiz
2. Observe the share button on results screen
3. Complete a Brand/Generic Match quiz
4. Observe the share button on results screen
**Expected Result:** Share button is visible on results for all quiz types. The copied text reflects the correct quiz type label each time.
**Screenshot Checkpoint:** tests/screenshots/share-results/step-04-all-types.png
**Maps to:** AC-004, AC-010

### TC-005: Dark mode styling

**Precondition:** Device is in dark mode, quiz completed
**Steps:**
1. View the results screen
2. Observe the Share Results button
**Expected Result:** Button colors and feedback toast are consistent with the dark theme and have sufficient contrast.
**Screenshot Checkpoint:** tests/screenshots/share-results/step-05-dark-mode.png
**Maps to:** AC-011

## 4. Data Model

No new data entities. The share text is generated at render time from the existing `QuizResults` type and the session's `quizType`.

### Quiz Type Display Labels

| Internal Value | Display Label |
|---------------|---------------|
| `name-the-class` | Name the Class |
| `match-drug-to-class` | Match Drug to Class |
| `brand-generic-match` | Brand/Generic Match |
| `quick-5` | Quick 5 |

## 5. API Contract

N/A — no API calls. Uses browser APIs only (`navigator.clipboard`, `navigator.share`).

## 6. UI Behavior

### States

- **Default:** "Share Results" button displayed with a share/clipboard icon
- **Sharing (native):** Native share sheet opens; button remains in default state
- **Copied:** Button text or adjacent indicator changes to "Copied!" for 2 seconds, then reverts
- **Hidden:** If neither clipboard nor share APIs are available, the button is not rendered

### Button Design

- Position: Below the score breakdown grid, above the action buttons row (New Quiz / Retry)
- Style: Secondary/outline button consistent with existing results screen actions
- Icon: Share icon (or clipboard icon on desktop)
- Text: "Share Results"
- Feedback: "Copied!" text replaces button label or appears as an adjacent indicator for 2 seconds
- Dark mode: Consistent with existing dark mode button styles

### Share Text Template

```
🎯 Rx Quiz: Scored {percentage}% on {quizTypeLabel} ({correctAnswers}/{totalQuestions}) — drug-quiz.calebdunn.tech
```

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Results screen with Share button (light mode) | tests/screenshots/share-results/step-01-button.png |
| 2 | "Copied!" feedback shown | tests/screenshots/share-results/step-02-copied.png |
| 3 | Results screen in dark mode | tests/screenshots/share-results/step-03-dark.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| `navigator.clipboard` blocked by browser permissions | Catch the error silently; optionally show a brief "Could not copy" message |
| `navigator.share()` throws AbortError (user cancelled) | Swallow the error, no feedback shown |
| `navigator.share()` throws for other reasons | Fall back to clipboard copy |
| Insecure context (HTTP, not localhost) | Both APIs may be unavailable; hide the button entirely (AC-009) |
| Percentage rounds to non-integer | Display as integer (already handled by QuizResults — `percentage` is a whole number) |
| Very fast double-click on share button | Debounce or ignore subsequent clicks while "Copied!" feedback is active |

## 8. Dependencies

- `QuizResults` component (`src/components/QuizResults.tsx`) — the button is added here
- `QuizResults` type and `SessionQuizType` from `src/types/quiz.ts` — for quiz type labels
- The component needs access to the `quizType` from the session config (currently `QuizResultsProps` does not include it — the prop interface will need to be extended or the type passed through)

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-26 | 0.1.0 | Caleb Dunn | Initial spec |
