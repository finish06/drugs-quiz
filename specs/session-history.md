# Spec: Session History & Personal Best

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M3 (Learning Loop & Retention)
**Status:** Draft

## 1. Overview

Store quiz session results in localStorage and display them on the home screen. Show the last 10 sessions and a personal best score per quiz type. Gives users a sense of trajectory and progress without requiring accounts.

### User Story

As a pharmacy student, I want to see my recent quiz sessions and best scores so that I can track my improvement over time without creating an account.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | After completing a quiz, the session result (date/time, quiz type, question count, score, percentage) is saved to localStorage | Must |
| AC-002 | A "Recent Sessions" section appears on the home screen (QuizConfig) as a collapsible section, expanded by default | Must |
| AC-003 | The section displays the last 10 sessions in reverse chronological order (newest first) | Must |
| AC-004 | Each session entry shows: quiz type, score (e.g., "8/10"), percentage, and relative date (e.g., "2 hours ago", "Yesterday") | Must |
| AC-005 | A "Personal Best" display shows the highest percentage achieved per quiz type | Must |
| AC-006 | Personal best updates automatically when a new high score is achieved | Must |
| AC-007 | localStorage stores a maximum of 10 sessions; oldest is evicted when an 11th is added | Must |
| AC-008 | When no sessions exist, the section shows: "Complete your first quiz to start tracking progress" | Must |
| AC-009 | The collapsible section can be toggled open/closed; collapse state persists in localStorage | Should |
| AC-010 | Session data survives page reload and browser restart | Must |

## 3. User Test Cases

### TC-001: First session creates history entry

**Precondition:** No session history in localStorage (fresh browser or cleared storage)
**Steps:**
1. Open the app
2. Observe the history section shows empty state message
3. Start and complete a 5-question Name the Class quiz, scoring 4/5
4. Return to the home screen
**Expected Result:** "Recent Sessions" shows 1 entry with "Name the Class — 4/5 (80%)" and "Just now". Personal Best shows "Name the Class: 80%"
**Screenshot Checkpoint:** tests/screenshots/session-history/step-01-first-session.png
**Maps to:** TBD

### TC-002: Multiple sessions accumulate

**Precondition:** 3 existing sessions in localStorage
**Steps:**
1. Open the app
2. Complete a quiz
3. Return to home screen
**Expected Result:** 4 sessions shown, newest at top. Personal best updated if new score is higher.
**Screenshot Checkpoint:** tests/screenshots/session-history/step-02-multiple-sessions.png
**Maps to:** TBD

### TC-003: 11th session evicts oldest

**Precondition:** 10 sessions in localStorage
**Steps:**
1. Complete a new quiz
2. Return to home screen
**Expected Result:** 10 sessions shown (not 11). The oldest session is gone. Newest is at top.
**Screenshot Checkpoint:** tests/screenshots/session-history/step-03-eviction.png
**Maps to:** TBD

### TC-004: Collapse state persists

**Precondition:** At least 1 session exists
**Steps:**
1. Collapse the "Recent Sessions" section
2. Reload the page
**Expected Result:** Section remains collapsed after reload
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

## 4. Data Model

### SessionRecord (localStorage)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique ID (timestamp-based or UUID) |
| completedAt | string (ISO 8601) | Yes | When the session was completed |
| quizType | "name-the-class" \| "match-drug-to-class" \| "brand-generic-match" \| "quick-5" | Yes | Which quiz type was played |
| questionCount | number | Yes | Total questions in the session |
| correctCount | number | Yes | Number of correct answers |
| percentage | number | Yes | Score as percentage (0-100) |

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `dq-session-history` | SessionRecord[] | Array of last 10 sessions, newest first |
| `dq-history-collapsed` | boolean | Whether the history section is collapsed |

### Relationships

Personal best is computed from `dq-session-history` at render time (max percentage per quizType). No separate storage needed.

## 5. API Contract

N/A — all localStorage, no API calls.

## 6. UI Behavior

### States

- **Loading:** N/A (localStorage is synchronous)
- **Empty:** "Complete your first quiz to start tracking progress" with a subtle icon
- **Populated:** List of sessions + personal best badges per quiz type
- **Collapsed:** Section header with chevron, no content visible

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Empty state on first visit | tests/screenshots/session-history/step-01-empty.png |
| 2 | Populated with 3+ sessions | tests/screenshots/session-history/step-02-populated.png |
| 3 | Personal best badges | tests/screenshots/session-history/step-03-best.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| localStorage is full or unavailable | Gracefully degrade — quiz still works, history just doesn't save. No error shown. |
| User clears browser data | History resets to empty state. No error. |
| Two tabs open, both complete quizzes | Each tab reads/writes independently. Last write wins. Acceptable at alpha maturity. |
| Session with 0 questions (shouldn't happen) | Don't save sessions with 0 questions |

## 8. Dependencies

- QuizResults component must call a save function after displaying results
- Home screen (QuizConfig) must render the new history section

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
