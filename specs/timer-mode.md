# Spec: Timer / Countdown Mode

**Version:** 0.1.0
**Created:** 2026-03-26
**PRD Reference:** docs/prd.md (Exam Simulation)
**Status:** Draft

## 1. Overview

Add an optional per-question countdown timer to quiz sessions. When enabled, each question has a configurable time limit (30s, 60s, or 90s). A visual countdown bar with a green-to-yellow-to-red color gradient shows remaining time. If the timer expires before the user answers, the question is auto-marked as incorrect and the quiz auto-advances. The results screen shows timing statistics including average time per question and which questions timed out. The timer pauses when the browser tab loses focus to prevent unfair penalization.

The existing untimed flow is unchanged. Timed mode is off by default and fully opt-in.

### User Story

As a pharmacy student preparing for a board exam, I want to practice answering drug questions under time pressure so that I can build speed and simulate exam conditions.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "Timed Mode" toggle switch appears on the QuizConfig screen, off by default | Must |
| AC-002 | When "Timed Mode" is toggled on, a time-limit selector appears with options: 30s, 60s, 90s (default 60s) | Must |
| AC-003 | When "Timed Mode" is off, the quiz behaves exactly as it does today (no timer, no auto-advance, no timing data) | Must |
| AC-004 | During a timed quiz, a countdown bar is displayed at the top of each question (both MultipleChoice and MatchingQuiz) | Must |
| AC-005 | The countdown bar uses a color gradient: green (>50% time remaining) to yellow (25%-50%) to red (<25%) | Must |
| AC-006 | A numeric seconds-remaining counter is displayed alongside the countdown bar | Must |
| AC-007 | When the timer reaches 0 on a question, the question is automatically marked as incorrect | Must |
| AC-008 | When the timer reaches 0, the quiz auto-advances to the next question after a brief delay (1.5s) showing a "Time's up!" message | Must |
| AC-009 | The timer resets to the full configured duration at the start of each new question | Must |
| AC-010 | The timer pauses when the browser tab loses focus (document.hidden === true) and resumes when focus returns | Must |
| AC-011 | On the results screen, an "Average Time" stat shows the mean seconds per question (excluding timed-out questions) | Must |
| AC-012 | On the results screen, timed-out questions are visually distinguished in the question breakdown (e.g., a clock icon or "Timed out" label) | Must |
| AC-013 | Quick 5 mode respects the "Timed Mode" toggle: if timed mode is on when Quick 5 is tapped, the Quick 5 session uses the selected time limit | Must |
| AC-014 | The timer does not run during the answer feedback phase (after user selects an answer but before tapping "Next Question") | Must |
| AC-015 | The QuizConfig type in quiz.ts is extended with optional timer fields (timedMode, timeLimitSeconds) | Must |
| AC-016 | The AnswerDetail type is extended with optional timing fields (timeSpentSeconds, timedOut) | Must |
| AC-017 | The timer toggle and time-limit selector are accessible (proper aria-labels, keyboard navigable) | Should |
| AC-018 | SessionRecord is extended with optional timedMode and timeLimitSeconds fields so history can show whether a session was timed | Should |

## 3. User Test Cases

### TC-001: Enable timed mode and start a quiz

**Precondition:** App is on the home screen, timed mode is off
**Steps:**
1. Toggle "Timed Mode" on
2. Select 30s time limit
3. Select "Name the Class" quiz type, 5 questions
4. Tap "Start Quiz"
**Expected Result:** Quiz starts. A countdown bar appears at the top of question 1, starting at 30 seconds, colored green.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-01-timer-active.png
**Maps to:** AC-001, AC-002, AC-004, AC-005, AC-006, AC-009

### TC-002: Timer counts down and changes color

**Precondition:** Timed quiz in progress, 30s time limit
**Steps:**
1. Watch the timer without answering
2. Observe at ~15s remaining
3. Observe at ~7s remaining
**Expected Result:** Timer bar shrinks from right to left. Color transitions from green to yellow around 15s, then to red around 7.5s. Numeric counter updates each second.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-02-color-gradient.png
**Maps to:** AC-005, AC-006

### TC-003: Timer expires and auto-advances

**Precondition:** Timed quiz in progress, 30s time limit
**Steps:**
1. Let the timer expire on question 1 without answering
2. Observe the "Time's up!" message
3. Wait for auto-advance
**Expected Result:** At 0 seconds, a "Time's up!" indicator appears. After ~1.5s delay, quiz advances to question 2 with a fresh 30s timer. Question 1 is marked incorrect.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-03-times-up.png
**Maps to:** AC-007, AC-008, AC-009

### TC-004: Timer stops after answering

**Precondition:** Timed quiz in progress, 60s time limit
**Steps:**
1. Answer question 1 at the 45-second mark (15s elapsed)
2. Observe the timer bar
3. Tap "Next Question"
**Expected Result:** After selecting an answer, the timer stops and displays the remaining time frozen. Answer feedback is shown as normal. Timer resets to 60s on the next question.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-04-timer-stops.png
**Maps to:** AC-014, AC-009

### TC-005: Timer pauses on tab switch

**Precondition:** Timed quiz in progress, 60s time limit, ~50s remaining
**Steps:**
1. Switch to a different browser tab
2. Wait 10 seconds
3. Switch back to the quiz tab
**Expected Result:** Timer resumes from ~50s (not ~40s). No time was deducted while the tab was hidden.
**Screenshot Checkpoint:** N/A (cannot screenshot background tab behavior)
**Maps to:** AC-010

### TC-006: Results screen shows timing statistics

**Precondition:** Complete a 5-question timed quiz; answer 3 questions manually, let 2 time out
**Steps:**
1. View the results screen
**Expected Result:** Results show average time per answered question (calculated from the 3 manually answered). The 2 timed-out questions show a "Timed out" indicator in the question breakdown. Standard score, percentage, and answer review are all present.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-06-results-timing.png
**Maps to:** AC-011, AC-012

### TC-007: Untimed mode is unchanged

**Precondition:** App is on the home screen, timed mode is off (default)
**Steps:**
1. Start a normal quiz without toggling timed mode
2. Answer all questions at your own pace
**Expected Result:** No timer bar, no countdown, no timing stats on results. Identical behavior to the current app.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-07-untimed.png
**Maps to:** AC-003

### TC-008: Quick 5 with timed mode

**Precondition:** Timed mode is on, 90s selected
**Steps:**
1. Tap "Quick 5" button
**Expected Result:** Quick 5 session starts with a 90s countdown timer on each question. Mixed quiz types each show the timer.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-08-quick5-timed.png
**Maps to:** AC-013

### TC-009: Matching quiz with timer

**Precondition:** Timed quiz in progress, "Match Drug to Class" type
**Steps:**
1. Observe the timer on a matching question
2. Complete the matching before time expires
**Expected Result:** Timer bar displays at the top of the MatchingQuiz component. Timer stops when the user submits the final match pair. Behavior is consistent with MultipleChoice timer.
**Screenshot Checkpoint:** tests/screenshots/timer-mode/step-09-matching-timer.png
**Maps to:** AC-004, AC-014

## 4. Data Model

### Changes to QuizConfig (src/types/quiz.ts)

```typescript
export interface QuizConfig {
  type: QuizType | "quick-5";
  questionCount: number;
  /** Whether timed mode is enabled (default false) */
  timedMode?: boolean;
  /** Per-question time limit in seconds (30, 60, or 90). Only used when timedMode is true */
  timeLimitSeconds?: 30 | 60 | 90;
}
```

### Changes to AnswerDetail (src/types/quiz.ts)

```typescript
export interface AnswerDetail extends Answer {
  question: Question;
  userAnswer: string | Record<string, string>;
  /** Seconds the user spent on this question (only present in timed mode) */
  timeSpentSeconds?: number;
  /** Whether this question timed out (only present in timed mode) */
  timedOut?: boolean;
}
```

### Changes to QuizResults (src/types/quiz.ts)

```typescript
export interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  answers: AnswerDetail[];
  /** Average seconds per answered question, excluding timed-out questions (only present in timed mode) */
  averageTimeSeconds?: number;
  /** Number of questions that timed out (only present in timed mode) */
  timedOutCount?: number;
}
```

### Changes to SessionRecord (src/types/quiz.ts)

```typescript
export interface SessionRecord {
  id: string;
  completedAt: string;
  quizType: SessionQuizType;
  questionCount: number;
  correctCount: number;
  percentage: number;
  /** Whether the session used timed mode */
  timedMode?: boolean;
  /** Per-question time limit used (only if timedMode) */
  timeLimitSeconds?: number;
}
```

### New: TimerState (internal, not persisted)

```typescript
/** Internal state for the countdown timer hook */
interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  hasExpired: boolean;
}
```

### localStorage

No new localStorage keys. Timer configuration is part of the quiz config (ephemeral per-session). SessionRecord gains optional fields but the `dq-session-history` key is unchanged.

## 5. API Contract

N/A -- timer is entirely client-side. No API changes.

## 6. UI Behavior

### QuizConfig Screen

- **Timed Mode toggle:** Positioned after the "Number of Questions" section, before the "Start Quiz" button. Uses a switch/toggle component.
- **Time limit selector:** Appears below the toggle when timed mode is on. Three pill-style buttons (30s, 60s, 90s), same visual pattern as the question count selector. 60s selected by default.
- **Quick 5 interaction:** When Quick 5 is tapped, it reads the current timed mode toggle state and time limit. No additional config UI needed.

### In-Quiz Timer Display

- **Position:** Above the question number / progress bar, full width of the question card.
- **Countdown bar:** Horizontal bar that shrinks from right to left as time decreases. Height ~6px with rounded ends.
- **Color gradient:** CSS transition or interpolation:
  - Green (#22c55e) when > 50% time remaining
  - Yellow (#eab308) when 25%-50% time remaining
  - Red (#ef4444) when < 25% time remaining
- **Numeric counter:** Right-aligned next to the bar, showing remaining seconds (whole numbers, no decimals).
- **Time's up state:** Bar fully depleted, numeric counter shows "0s", a "Time's up!" label appears centered below the bar in red text. After 1.5s, auto-advances.

### Results Screen (Timed Sessions Only)

- **Average Time stat:** Added to the existing 3-column stats grid as a 4th item, or displayed below the grid. Shows e.g., "42s avg" with label "Avg Time".
- **Timed-out indicators:** In the question breakdown circles, timed-out questions use an orange/amber color with a small clock icon instead of the red incorrect indicator.
- **Answer review:** Timed-out questions in the AnswerReviewSection show "Timed out (no answer)" instead of the user's answer.

### States

- **Timer running:** Bar animating, counter decrementing each second
- **Timer paused (tab hidden):** Bar and counter frozen at current value
- **Timer stopped (answered):** Bar and counter frozen at the value when the answer was submitted
- **Timer expired:** Bar empty, "Time's up!" shown, 1.5s delay before auto-advance
- **Untimed:** No timer UI rendered at all

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | QuizConfig with timed mode toggle on and time selector visible | tests/screenshots/timer-mode/step-01-config.png |
| 2 | Question with timer bar at green (>50%) | tests/screenshots/timer-mode/step-02-green.png |
| 3 | Question with timer bar at yellow (25%-50%) | tests/screenshots/timer-mode/step-03-yellow.png |
| 4 | Question with timer bar at red (<25%) | tests/screenshots/timer-mode/step-04-red.png |
| 5 | "Time's up!" state on expired question | tests/screenshots/timer-mode/step-05-expired.png |
| 6 | Results screen with timing statistics | tests/screenshots/timer-mode/step-06-results.png |
| 7 | Matching quiz with active timer | tests/screenshots/timer-mode/step-07-matching.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User answers at the exact moment timer hits 0 | If the answer was submitted before the expiry callback fires, treat as a valid answer (not timed out). Use the answered state as the source of truth. |
| All questions time out | Results show 0% score, average time is N/A or not displayed, all questions marked as timed out. |
| Browser tab loses focus at 1 second remaining | Timer pauses at 1 second. On return, user has 1 second remaining. Timer does not expire while tab is hidden. |
| User rapidly switches tabs back and forth | Timer tracks only visible time. Multiple pause/resume cycles must not drift or accumulate rounding errors. Use wall-clock delta calculation rather than interval counting. |
| Timer expires during matching quiz with partial matches | Partial matches are discarded. The entire question is marked incorrect and timed out. |
| Question generation is slow (lazy loading) | Timer does not start until the question is fully rendered and visible. If the user is waiting for a question to load, no time is consumed. |
| User toggles timed mode off between sessions | Next session is untimed. No timer fields appear in the config or results. Previous timed sessions retain their timing data in history. |
| Screen reader active | Announce time remaining at 50%, 25%, and 10% marks via aria-live region. Announce "Time's up" when timer expires. |
| Very slow device / JS thread blocked | Use requestAnimationFrame or performance.now() for visual updates but rely on wall-clock time (Date.now()) for the authoritative elapsed time to prevent drift. |

## 8. Dependencies

- QuizConfig component (adds toggle and time-limit selector)
- MultipleChoice component (adds timer display)
- MatchingQuiz component (adds timer display)
- QuizResults component (adds timing statistics)
- useQuizSession hook (passes timer config, records timing data per answer)
- New useQuestionTimer hook (encapsulates countdown logic, visibility API pause/resume)
- quiz.ts types (extended with timer fields)

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-26 | 0.1.0 | Caleb Dunn | Initial spec |
