# Spec: Spaced Repetition (localStorage)

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Draft

## 1. Overview

Track which drugs users get wrong and weight future question selection to surface weak drugs more often. All data lives in localStorage. Includes a "Study Weak Drugs" flashcard mode accessible from the results screen that drills weak drugs until the user exits.

### User Story

As a pharmacy student, I want the quiz to focus on drugs I struggle with so that I spend more time studying what I don't know instead of repeating what I already know.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | After each quiz, drug performance data is saved to localStorage: drug name, times seen, times correct, times incorrect | Must |
| AC-002 | Drug performance is tracked globally (shared across all quiz types) — a weak drug in Name the Class is also weak in Match Drug to Class | Must |
| AC-003 | Quiz generators accept an optional weight map and bias question selection toward weak drugs (~3-4x more likely to appear) | Must |
| AC-004 | The weighting decays as the user gets a drug right — consecutive correct answers reduce the bias back toward baseline | Must |
| AC-005 | A maximum of 200 drugs are tracked in localStorage; oldest/least-seen drugs are evicted when the limit is exceeded | Must |
| AC-006 | The results screen shows a "Study Weak Drugs" button when the user has at least 1 weak drug (accuracy < 60%) | Must |
| AC-007 | Tapping "Study Weak Drugs" launches a flashcard-style drill that shows drug name → user taps to reveal class → repeats with next weak drug | Must |
| AC-008 | The flashcard drill cycles through all weak drugs repeatedly until the user taps "Exit" | Must |
| AC-009 | Flashcard drill does not affect the spaced repetition scores (it's passive review, not scored) | Must |
| AC-010 | When no performance data exists yet, quiz generators behave exactly as they do today (uniform random selection) | Must |
| AC-011 | Spaced repetition data survives page reload and browser restart | Must |
| AC-012 | The home screen shows a subtle indicator of how many weak drugs the user has (e.g., "12 drugs to review") | Should |

## 3. User Test Cases

### TC-001: First quiz creates drug performance records

**Precondition:** No spaced repetition data in localStorage
**Steps:**
1. Complete a 5-question Name the Class quiz, getting 3 right and 2 wrong
2. Check localStorage
**Expected Result:** 5 drug entries created. 3 have `{ seen: 1, correct: 1 }`. 2 have `{ seen: 1, correct: 0 }`.
**Maps to:** AC-001, AC-010

### TC-002: Weak drugs appear more often in subsequent quizzes

**Precondition:** 10+ drugs tracked, 3 with < 30% accuracy
**Steps:**
1. Start a new 10-question quiz
2. Observe which drugs appear
**Expected Result:** The 3 weak drugs are significantly more likely to appear than strong drugs (~3-4x bias).
**Maps to:** AC-003

### TC-003: Correct answers reduce bias over time

**Precondition:** A drug has 0% accuracy (seen 3 times, correct 0)
**Steps:**
1. Answer that drug correctly in 3 consecutive quizzes
**Expected Result:** The drug's weight progressively decreases toward baseline. After 3 correct answers, it's no longer heavily biased.
**Maps to:** AC-004

### TC-004: Study Weak Drugs flashcard drill

**Precondition:** At least 3 drugs with < 60% accuracy
**Steps:**
1. Complete a quiz
2. On results screen, tap "Study Weak Drugs"
3. See a flashcard with drug name
4. Tap to reveal the drug's class
5. Tap "Next" to see the next weak drug
6. After cycling through all weak drugs, they repeat
7. Tap "Exit" to return to results
**Expected Result:** Flashcards show all weak drugs in sequence, cycling indefinitely. Exit returns to results screen.
**Screenshot Checkpoint:** tests/screenshots/spaced-repetition/step-04-flashcard.png
**Maps to:** AC-006, AC-007, AC-008, AC-009

### TC-005: 201st drug evicts oldest

**Precondition:** 200 drugs tracked in localStorage
**Steps:**
1. Complete a quiz with a new drug not in the tracker
**Expected Result:** New drug is added. The drug with the oldest `lastSeen` timestamp and fewest total views is evicted. Total remains 200.
**Maps to:** AC-005

## 4. Data Model

### DrugPerformance (localStorage)

```typescript
interface DrugPerformance {
  /** Lowercase drug name (canonical key) */
  drugName: string;
  /** Display name (title case) */
  displayName: string;
  /** Drug's correct pharmacological class */
  drugClass: string;
  /** Total times this drug appeared in a quiz */
  timesSeen: number;
  /** Total times answered correctly */
  timesCorrect: number;
  /** Consecutive correct streak (resets on incorrect) */
  streak: number;
  /** ISO 8601 timestamp of last encounter */
  lastSeen: string;
}
```

### WeightMap (computed, not stored)

```typescript
/** Map of lowercase drug name → selection weight multiplier */
type WeightMap = Map<string, number>;
```

**Weight formula:**
```
accuracy = timesCorrect / timesSeen
baseWeight = 1.0

if accuracy < 0.3:  weight = 4.0  (very weak — 4x bias)
if accuracy < 0.6:  weight = 3.0  (weak — 3x bias)
if accuracy < 0.8:  weight = 1.5  (moderate — slight bias)
else:               weight = 1.0  (strong — no bias)

// Decay: consecutive correct streak reduces weight toward 1.0
weight = max(1.0, weight - (streak * 0.5))
```

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `dq-drug-performance` | DrugPerformance[] | Array of up to 200 drug performance records |

### Eviction Strategy

When adding a drug that would exceed 200:
1. Sort by `lastSeen` ascending (oldest first)
2. Among the oldest 20%, pick the one with the fewest `timesSeen`
3. Evict that entry

## 5. API Contract

N/A — all localStorage. Quiz generators are modified to accept weights but make no new API calls.

## 6. UI Behavior

### Results Screen — Study Weak Drugs Button

Appears between the breakdown circles and the Retry/New Quiz buttons when weak drugs exist:

```
┌──────────────────────────────────────┐
│  📚 Study Weak Drugs (12 to review)  │
└──────────────────────────────────────┘
```

- Brand accent color outline (not filled — secondary action)
- Only shows when at least 1 drug has < 60% accuracy
- Count shows total weak drugs

### Flashcard Drill Screen

```
┌──────────────────────────────────────┐
│           Study Mode                 │
│         3 of 12 drugs                │
│                                      │
│      ┌────────────────────┐          │
│      │                    │          │
│      │    Simvastatin     │          │
│      │                    │          │
│      │  [Tap to reveal]   │          │
│      │                    │          │
│      └────────────────────┘          │
│                                      │
│           [ Exit ]                   │
└──────────────────────────────────────┘
```

After tap:

```
┌──────────────────────────────────────┐
│           Study Mode                 │
│         3 of 12 drugs                │
│                                      │
│      ┌────────────────────┐          │
│      │                    │          │
│      │    Simvastatin     │          │
│      │         ↓          │          │
│      │  HMG-CoA Reductase │          │
│      │     Inhibitor      │          │
│      │                    │          │
│      └────────────────────┘          │
│                                      │
│     [ Next ]      [ Exit ]           │
└──────────────────────────────────────┘
```

### Home Screen Indicator (Should)

Below the Quick 5 button, a subtle text line:

```
12 drugs to review · Study →
```

Tapping it opens the flashcard drill directly.

### States

- **No SR data:** Quiz generators use uniform random (existing behavior). No Study button on results. No indicator on home.
- **Has weak drugs:** Study button on results, indicator on home, generators use weighted selection.
- **No weak drugs (all strong):** No Study button, no indicator. User has mastered tracked drugs.
- **Flashcard — unrevealed:** Shows drug name, "Tap to reveal" prompt
- **Flashcard — revealed:** Shows drug name + class, Next and Exit buttons

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Results with Study Weak Drugs button | tests/screenshots/spaced-repetition/step-01-results-button.png |
| 2 | Flashcard unrevealed | tests/screenshots/spaced-repetition/step-02-flashcard-front.png |
| 3 | Flashcard revealed | tests/screenshots/spaced-repetition/step-03-flashcard-back.png |
| 4 | Home screen with weak drug indicator | tests/screenshots/spaced-repetition/step-04-home-indicator.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Drug appears in multiple quiz types | Same performance record updated (shared tracking per AC-002) |
| Matching question — partial correct | Each drug in the matching set is tracked individually (correct or incorrect based on its specific pair) |
| localStorage full or unavailable | Gracefully degrade — quiz works normally, just no weighting. No error shown. |
| User clears browser data | Performance resets. Quiz returns to uniform random. |
| Brand/Generic quiz — track both names? | Track by generic name only (canonical key). Brand name is not separately tracked. |
| Flashcard drill with 1 weak drug | Shows the 1 drug, then cycles back to it. User exits when ready. |
| All drugs become strong after studying | Study button disappears from results. Indicator disappears from home. |

## 8. Dependencies

- Quiz generators (`quiz-generators.ts`) must accept optional `WeightMap` for biased selection
- `useQuizSession` hook must report drug-level results (which drugs were correct/incorrect) — enabled by answer-review's `AnswerDetail` type
- Results screen (`QuizResults.tsx`) must render Study button and flashcard drill
- Home screen (`QuizConfig.tsx`) must render weak drug indicator (Should priority)
- **answer-review spec:** Depends on `AnswerDetail` type which carries the question data needed to extract drug names and classes for performance tracking

## 9. Generator Modification

The key change is in how quiz generators select drugs. Currently, generators pick random drugs from random classes. With spaced repetition:

1. `generateSingleQuestion` accepts an optional `WeightMap`
2. When a `WeightMap` is provided, the generator:
   a. Fetches candidate drugs from a class (as usual)
   b. Assigns each candidate a weight from the map (default 1.0 if not tracked)
   c. Uses weighted random selection instead of `[0]` first-match
3. This is a soft bias — if no weak drugs happen to be in the fetched class, the generator falls back to normal random selection

This approach preserves the existing generator architecture while layering on weighting.

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from /add:cycle interview |
