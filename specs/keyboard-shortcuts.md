# Spec: Keyboard Shortcuts

**Version:** 0.1.0
**Created:** 2026-03-26
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Complete

## 1. Overview

Add keyboard shortcuts to the multiple-choice quiz flow for power users. Number keys 1-4 select answer choices, Enter advances to the next question after answering, and Escape triggers the exit confirmation. Subtle key hints are shown on answer buttons so users can discover the shortcuts naturally.

### User Story

As a pharmacy student drilling through many questions, I want to use keyboard shortcuts to select answers and advance so that I can maintain flow and study faster without reaching for the mouse.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Pressing number keys 1, 2, 3, or 4 selects the corresponding answer choice in a multiple-choice question (1 = first option, 2 = second, etc.) | Must |
| AC-002 | Number key shortcuts only work when the question has not yet been answered (pre-answer state) | Must |
| AC-003 | After answering a question, pressing Enter or Return advances to the next question (equivalent to clicking the "Next Question" button) | Must |
| AC-004 | Pressing Escape during an in-progress quiz triggers the exit confirmation flow (same as clicking the exit/back button) | Must |
| AC-005 | Each answer button displays a subtle number badge (1-4) indicating its keyboard shortcut | Must |
| AC-006 | Number badges are visually subtle — small, muted color, positioned at the leading edge of the button — so they do not distract from the answer text | Must |
| AC-007 | Keyboard shortcuts are only active during the multiple-choice quiz flow (not on QuizConfig, QuizResults, FlashcardDrill, or MatchingQuiz screens) | Must |
| AC-008 | Keyboard shortcuts do not interfere with browser default shortcuts (Ctrl+R, Cmd+C, Alt+Tab, etc.) — only bare key presses without modifiers are captured | Must |
| AC-009 | Keyboard shortcuts do not interfere with screen readers or assistive technology — event listeners do not suppress default behavior for modified key combos | Must |
| AC-010 | Pressing a number key outside the valid range (e.g., 5, 6, 0) does nothing | Should |
| AC-011 | After the last question is answered, Enter triggers "See Results" (same button, same behavior as "Next Question") | Must |
| AC-012 | Number badges are visible in both light and dark mode with sufficient contrast | Must |

## 3. User Test Cases

### TC-001: Select answer with number key

**Precondition:** Multiple-choice question is displayed, not yet answered
**Steps:**
1. Press the "2" key on the keyboard
**Expected Result:** The second answer option is selected. Answer feedback is shown (correct or incorrect). The "Next Question" button appears.
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-01-number-select.png
**Maps to:** AC-001, AC-002

### TC-002: Advance with Enter key

**Precondition:** Multiple-choice question has been answered, "Next Question" button is visible
**Steps:**
1. Press the Enter key
**Expected Result:** The quiz advances to the next question.
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-02-enter-advance.png
**Maps to:** AC-003

### TC-003: Exit quiz with Escape key

**Precondition:** Quiz is in progress (any question, answered or unanswered)
**Steps:**
1. Press the Escape key
**Expected Result:** The exit confirmation dialog or flow is triggered (same as clicking the exit button).
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-03-escape-exit.png
**Maps to:** AC-004

### TC-004: Number badges visible on answer buttons

**Precondition:** Multiple-choice question is displayed
**Steps:**
1. Observe the answer option buttons
**Expected Result:** Each button shows a small number badge (1, 2, 3, 4) at its leading edge. Badges are muted in color and do not obscure the answer text.
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-04-badges-light.png
**Maps to:** AC-005, AC-006

### TC-005: Number badges in dark mode

**Precondition:** Dark mode is enabled, multiple-choice question is displayed
**Steps:**
1. Observe the answer option buttons
**Expected Result:** Number badges are visible with sufficient contrast against the dark button background.
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-05-badges-dark.png
**Maps to:** AC-012

### TC-006: Shortcuts inactive on matching quiz

**Precondition:** A matching quiz (match-drug-to-class or brand-generic-match) is in progress
**Steps:**
1. Press "1", "2", "3", or "4" keys
2. Press Enter
**Expected Result:** No quiz action is triggered. The matching quiz interaction remains tap/click-only.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-007

### TC-007: Shortcuts inactive after answering (number keys)

**Precondition:** Multiple-choice question has been answered, feedback is showing
**Steps:**
1. Press "3" key
**Expected Result:** Nothing happens. The already-selected answer and feedback remain unchanged. A second answer is not registered.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-002

### TC-008: Browser shortcuts not intercepted

**Precondition:** Multiple-choice question is displayed
**Steps:**
1. Press Ctrl+R (or Cmd+R on macOS)
2. Press Ctrl+C
3. Press Alt+1
**Expected Result:** Browser default behavior executes normally (reload, copy, etc.). The quiz does not treat these as answer selections.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-008

### TC-009: Enter on last question goes to results

**Precondition:** On the final question of a quiz, answer has been submitted
**Steps:**
1. Press Enter
**Expected Result:** The results screen is shown (same as clicking "See Results").
**Screenshot Checkpoint:** tests/screenshots/keyboard-shortcuts/step-09-enter-results.png
**Maps to:** AC-011

## 4. Data Model

No new data entities. This feature is purely a UI interaction layer on the existing MultipleChoice component.

## 5. API Contract

N/A — no API calls. Keyboard event handling is entirely client-side.

## 6. UI Behavior

### Keyboard Event Handling

- Attach a `keydown` event listener (via `useEffect`) scoped to the MultipleChoice component's lifecycle
- Check `event.metaKey`, `event.ctrlKey`, `event.altKey`, `event.shiftKey` — if any modifier is held, ignore the event
- Map `event.key` values: "1" through "4" for answer selection, "Enter" for next, "Escape" for exit
- Clean up the listener on component unmount to prevent shortcuts leaking to other screens

### Number Badge Design

- Position: inline at the start of each answer button, before the answer text
- Style: small rounded square or circle, muted gray background (`bg-gray-200 dark:bg-gray-700`), smaller font size (`text-xs`), monospace or semi-bold
- Spacing: small gap between badge and answer text
- The badge is decorative/informational and should have `aria-hidden="true"` so screen readers skip it

### States

- **Pre-answer:** Number keys 1-4 are active. Enter does nothing (no next button yet). Escape triggers exit.
- **Post-answer:** Number keys are ignored. Enter triggers next/results. Escape triggers exit.
- **Quiz not active (config, results, flashcard, matching):** All shortcuts are inactive.

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Answer buttons with number badges (light mode) | tests/screenshots/keyboard-shortcuts/step-01-badges-light.png |
| 2 | Answer buttons with number badges (dark mode) | tests/screenshots/keyboard-shortcuts/step-02-badges-dark.png |
| 3 | Post-answer state showing Enter hint | tests/screenshots/keyboard-shortcuts/step-03-post-answer.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User presses number key while answer feedback animation is playing | The answer is already locked in; number key is ignored (answered state) |
| User presses Enter before answering | Nothing happens — the "Next Question" button does not exist yet |
| User holds down a number key (key repeat) | Only the first keydown registers the answer; subsequent repeats are ignored because question is now answered |
| User presses Escape on the first question | Exit confirmation is triggered (same as any other question) |
| Question has fewer than 4 options (unlikely but defensive) | Only number keys up to the option count are active; pressing "4" on a 3-option question does nothing |
| Focus is in a text input or other form element | Shortcuts should not fire if `event.target` is an input, textarea, or contenteditable element |
| Mobile/tablet device with no physical keyboard | Number badges are still shown (they double as visual option numbering) but shortcuts are simply unused |

## 8. Dependencies

- MultipleChoice component (`src/components/MultipleChoice.tsx`) — primary integration point
- Exit confirmation flow (however it is currently implemented — the Escape key triggers the same action)
- useQuizSession hook (`src/hooks/useQuizSession.ts`) — for the `onNext` and exit callbacks

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-26 | 0.1.0 | Caleb Dunn | Initial spec |
