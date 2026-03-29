# Spec: Bookmark / Flag Questions for Review

**Version:** 0.1.0
**Created:** 2026-03-26
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Complete

## 1. Overview

Allow users to flag individual questions during a quiz for later review. Flagged questions are persisted in localStorage and can be replayed as a dedicated review quiz from the home screen. This gives users a lightweight way to build a personal "trouble list" without requiring an account.

### User Story

As a pharmacy student, I want to flag tricky questions during a quiz so that I can revisit them later in a focused review session without having to remember which drugs gave me trouble.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A flag/bookmark icon appears in the top-right corner of the question card during both multiple-choice and matching quiz flows | Must |
| AC-002 | Tapping the flag icon toggles the question's flagged state: filled icon = flagged, outline icon = unflagged | Must |
| AC-003 | The flag icon is tappable before and after answering a question (not disabled by answer state) | Must |
| AC-004 | Flagging a question immediately persists it to localStorage under the `dq-flagged-questions` key | Must |
| AC-005 | Unflagging a question immediately removes it from localStorage | Must |
| AC-006 | When a question card loads, the flag icon reflects the current flagged state (pre-filled if already flagged from a previous session) | Must |
| AC-007 | On the QuizConfig screen, a "Flagged Questions" section displays the count of currently flagged questions and a "Review Flagged" button | Must |
| AC-008 | The "Flagged Questions" section is hidden when the flagged count is 0 | Must |
| AC-009 | Tapping "Review Flagged" starts a quiz session using only the user's flagged questions | Must |
| AC-010 | During a flagged review quiz, the flag icon is still functional (users can unflag questions as they review them) | Must |
| AC-011 | On the QuizResults screen, flagged questions display a small flag icon on their question breakdown dot | Must |
| AC-012 | In the AnswerReviewSection (expanded review), each question row shows a clickable flag icon that toggles the flagged state | Must |
| AC-013 | Unflagging from the results review section immediately updates localStorage and the UI | Must |
| AC-014 | A maximum of 50 questions can be flagged; when the limit is exceeded, the oldest flagged question (by `flaggedAt` timestamp) is evicted | Must |
| AC-015 | Flagged questions persist across page reloads and browser restarts | Must |
| AC-016 | The flag icon is visible and has sufficient contrast in both light and dark mode | Must |
| AC-017 | The flag icon has an accessible label (`aria-label="Flag this question"` / `"Unflag this question"`) | Should |
| AC-018 | For multiple-choice questions, the flagged entry is keyed by drug name; for matching questions, it is keyed by a deterministic hash of the left items (sorted, joined) | Must |

## 3. User Test Cases

### TC-001: Flag a multiple-choice question during quiz

**Precondition:** Quiz is in progress, multiple-choice question displayed, question is not currently flagged
**Steps:**
1. Observe the flag icon in the top-right corner of the question card (outline style)
2. Tap the flag icon
**Expected Result:** Icon transitions to filled state. The question's drug name is saved to localStorage under `dq-flagged-questions`.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-01-flag-mc.png
**Maps to:** AC-001, AC-002, AC-004, AC-018

### TC-002: Unflag a question during quiz

**Precondition:** Quiz is in progress, the current question is already flagged (filled icon)
**Steps:**
1. Tap the filled flag icon
**Expected Result:** Icon transitions to outline state. The entry is removed from localStorage.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-02-unflag-mc.png
**Maps to:** AC-002, AC-005

### TC-003: Flag icon available after answering

**Precondition:** Multiple-choice question has been answered, feedback is showing
**Steps:**
1. Tap the flag icon
**Expected Result:** Flag toggles normally. Answering does not disable the flag interaction.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-003

### TC-004: Flag persists across sessions

**Precondition:** A question has been flagged in a previous quiz session
**Steps:**
1. Start a new quiz that includes the same drug
2. Reach the question for that drug
**Expected Result:** The flag icon is pre-filled, reflecting the previously saved flag.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-006, AC-015

### TC-005: Flagged Questions section on QuizConfig

**Precondition:** 3 questions are currently flagged in localStorage
**Steps:**
1. Navigate to the QuizConfig (home) screen
**Expected Result:** A "Flagged Questions" section is visible showing "3 flagged" and a "Review Flagged" button.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-05-config-section.png
**Maps to:** AC-007

### TC-006: Flagged section hidden when empty

**Precondition:** No flagged questions in localStorage
**Steps:**
1. Navigate to the QuizConfig screen
**Expected Result:** No "Flagged Questions" section is visible.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-008

### TC-007: Start a flagged review quiz

**Precondition:** 5 questions are flagged
**Steps:**
1. On QuizConfig, tap "Review Flagged"
**Expected Result:** A quiz starts with exactly those 5 flagged questions. Question count matches the flagged count.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-07-review-quiz.png
**Maps to:** AC-009

### TC-008: Unflag during flagged review quiz

**Precondition:** Flagged review quiz is in progress
**Steps:**
1. Unflag the current question by tapping the flag icon
**Expected Result:** Flag icon transitions to outline. The question is removed from localStorage. If the user returns to QuizConfig, the count reflects the removal.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-010

### TC-009: Flag icon on results breakdown dots

**Precondition:** Quiz complete, 2 of 5 questions were flagged during the quiz
**Steps:**
1. View the QuizResults screen
**Expected Result:** The 2 flagged question dots show a small flag indicator (e.g., tiny flag overlay or distinct border). Unflagged dots look normal.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-09-results-dots.png
**Maps to:** AC-011

### TC-010: Toggle flag from answer review section

**Precondition:** QuizResults screen, AnswerReviewSection expanded
**Steps:**
1. Find an unflagged question in the review list
2. Tap the flag icon next to it
**Expected Result:** Flag icon fills. Entry is added to localStorage. The breakdown dot above also updates to show the flag indicator.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-10-review-flag.png
**Maps to:** AC-012, AC-013

### TC-011: FIFO eviction at 50 limit

**Precondition:** 50 questions are currently flagged
**Steps:**
1. During a quiz, flag a 51st question
**Expected Result:** The oldest flagged question (earliest `flaggedAt`) is evicted. Total count remains 50. The newly flagged question is saved.
**Screenshot Checkpoint:** N/A
**Maps to:** AC-014

### TC-012: Flag a matching question

**Precondition:** Matching quiz in progress, question not flagged
**Steps:**
1. Tap the flag icon on the matching question card
**Expected Result:** Icon fills. The entry is stored with a key derived from the sorted left items.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-12-flag-matching.png
**Maps to:** AC-001, AC-002, AC-018

### TC-013: Dark mode contrast

**Precondition:** Dark mode enabled, quiz in progress
**Steps:**
1. Observe the flag icon (both outline and filled states)
**Expected Result:** Icon is clearly visible against the dark card background in both states.
**Screenshot Checkpoint:** tests/screenshots/bookmark-questions/step-13-dark-mode.png
**Maps to:** AC-016

## 4. Data Model

### FlaggedQuestion (localStorage entry)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | Yes | Unique identifier: drug name (MC) or sorted left-items hash (matching) |
| drugName | string | Yes | Primary drug name for display (MC: the drug name; matching: first left item) |
| displayLabel | string | Yes | Human-readable label for the flagged list (e.g., "Metoprolol" or "Match: Lisinopril, Metoprolol, ...") |
| questionKind | "multiple-choice" \| "matching" | Yes | Which quiz type generated this question |
| sourceQuizType | QuizType | Yes | The specific quiz type (name-the-class, match-drug-to-class, brand-generic-match) |
| correctAnswer | string | No | Correct class/answer (MC only, for regenerating the question) |
| correctPairs | Record<string, string> | No | Correct pairs (matching only, for regenerating the question) |
| flaggedAt | string (ISO 8601) | Yes | When the question was flagged (used for FIFO eviction) |

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `dq-flagged-questions` | FlaggedQuestion[] | Array of flagged questions, max 50 entries |

### Key Generation

- **Multiple-choice:** `mc:{drugName}` (e.g., `mc:Metoprolol Succinate`)
- **Matching:** `match:{sortedLeftItems.join(",")}` (e.g., `match:Atorvastatin,Lisinopril,Losartan,Metoprolol`)

Sorting the left items ensures the same set of drugs produces the same key regardless of display order.

## 5. API Contract

N/A -- all localStorage, no API calls. Flagged review quizzes reuse the existing question generation pipeline, seeded with stored `correctAnswer` / `correctPairs` data.

## 6. UI Behavior

### Flag Icon Design

- **Position:** Top-right corner of the question card, in the same row as the "Question N of M" header
- **Unflagged state:** Outline flag/bookmark SVG icon, muted gray (`text-gray-400 dark:text-gray-500`)
- **Flagged state:** Filled flag/bookmark SVG icon, amber/orange (`text-amber-500 dark:text-amber-400`)
- **Size:** 20x20px (h-5 w-5), with a tap target of at least 44x44px for mobile accessibility
- **Transition:** `transition-colors duration-150` for smooth toggle
- **Interaction:** `cursor-pointer`, subtle scale on hover (`hover:scale-110`)

### QuizConfig Flagged Section

- **Position:** Below the SessionHistory section
- **Layout:** Rounded card matching existing card style (`rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm`)
- **Content:** Flag icon + "N flagged questions" text + "Review Flagged" button
- **Button style:** Same as "Start Quiz" button (brand color, full width)
- **Hidden:** When flagged count is 0, the entire section is not rendered

### Results Screen Integration

- **Breakdown dots:** Flagged questions get a tiny flag overlay (small amber dot or border ring on the existing circle)
- **Review entries:** A small clickable flag icon at the right edge of each review entry row

### States

- **No flagged questions:** Flagged section hidden on QuizConfig. Flag icons on quiz cards default to outline.
- **Some flagged (1-49):** Section visible with count. Flag icons reflect per-question state.
- **At capacity (50):** Same as above. Next flag triggers FIFO eviction -- no user-facing warning, oldest silently removed.

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Flag icon (outline) on MC question card | tests/screenshots/bookmark-questions/step-01-unflagged-mc.png |
| 2 | Flag icon (filled) on MC question card | tests/screenshots/bookmark-questions/step-02-flagged-mc.png |
| 3 | Flag icon on matching question card | tests/screenshots/bookmark-questions/step-03-flagged-matching.png |
| 4 | Flagged Questions section on QuizConfig | tests/screenshots/bookmark-questions/step-04-config-section.png |
| 5 | Results breakdown dots with flag indicators | tests/screenshots/bookmark-questions/step-05-results-dots.png |
| 6 | Answer review section with flag toggle icons | tests/screenshots/bookmark-questions/step-06-review-flags.png |
| 7 | Dark mode flag icon visibility | tests/screenshots/bookmark-questions/step-07-dark-mode.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| localStorage is full or unavailable | Gracefully degrade -- flag icon still toggles visually in the session but does not persist. No error shown to user. |
| User clears browser data | All flags reset. Flagged section disappears from QuizConfig. No error. |
| Same drug appears in multiple quiz types (MC and matching) | Each gets its own key (`mc:DrugName` vs `match:...`). They are tracked independently. |
| Flagged review quiz with 0 flags (race condition: flags cleared between render and tap) | Show a brief message "No flagged questions to review" and return to QuizConfig. |
| Flagged question's drug no longer returned by the API | Skip it during review quiz generation. If all flagged questions are stale, show empty message. |
| User flags, reloads mid-quiz, starts new quiz | Flag persists in localStorage. New quiz picks up the flag state for any matching drugs. |
| Two tabs open, both flagging | Last write wins. Acceptable at alpha maturity. |
| Question breakdown dot is both incorrect and flagged | Show both indicators: red background (incorrect) + flag overlay. Flag does not replace correct/incorrect styling. |
| Flagged review quiz completed -- session saved to history | Yes, saved as a normal session with quizType matching the source types of the flagged questions (or "quick-5" if mixed types). |
| FIFO eviction removes a question the user is currently viewing as flagged | The icon updates to unflagged on next render if the entry is gone from storage. Unlikely in practice (requires flagging 50+ in one session). |

## 8. Dependencies

- MultipleChoice component (`src/components/MultipleChoice.tsx`) -- add flag icon to question card header
- MatchingQuiz component (`src/components/MatchingQuiz.tsx`) -- add flag icon to question card header
- QuizConfig component (`src/components/QuizConfig.tsx`) -- add flagged questions section
- QuizResults component (`src/components/QuizResults.tsx`) -- add flag indicators to breakdown dots
- AnswerReviewSection component (`src/components/AnswerReviewSection.tsx`) -- add flag toggle to review entries
- New hook: `useFlaggedQuestions` -- manages localStorage read/write, toggle, FIFO eviction, count
- Types: new `FlaggedQuestion` interface in `src/types/quiz.ts`

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-26 | 0.1.0 | Caleb Dunn | Initial spec |
