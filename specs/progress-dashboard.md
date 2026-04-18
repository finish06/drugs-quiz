# Spec: Progress Dashboard

**Version:** 0.1.0
**Created:** 2026-04-12
**PRD Reference:** docs/prd.md (M7: Study Experience)
**Milestone:** M7 — Study Experience
**Status:** Complete

## 1. Overview

A dedicated "My Progress" screen showing personal quiz analytics: overall accuracy, accuracy trends over time, weakest and strongest drug classes, quiz type breakdown, streak tracking, and summary stats. Data is computed server-side via a BFF endpoint for authenticated users (full history) and client-side from localStorage for unauthenticated users (limited to last 14 days, with a sign-in CTA to unlock full history).

### User Story

As a pharmacy student using Rx Drill, I want to see my quiz performance over time so that I can identify weak areas, track improvement, and stay motivated with streak tracking.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "My Progress" button appears on the quiz config screen | Must |
| AC-002 | Clicking "My Progress" navigates to a dedicated progress dashboard screen | Must |
| AC-003 | A "Back" button on the dashboard returns to the quiz config screen | Must |
| AC-004 | The dashboard displays overall accuracy (lifetime correct/total percentage) | Must |
| AC-005 | The dashboard displays an accuracy trend line chart | Must |
| AC-006 | The trend chart supports selectable time ranges: 7 days, 30 days, all time | Must |
| AC-007 | The dashboard displays the top 3-5 weakest drug classes by accuracy | Must |
| AC-008 | The dashboard displays the top 3-5 strongest drug classes by accuracy | Must |
| AC-009 | The dashboard displays total quizzes completed | Must |
| AC-010 | The dashboard displays total questions answered | Must |
| AC-011 | The dashboard displays a current streak (consecutive days with at least one quiz) | Must |
| AC-012 | Streak milestones at 3, 7, 14, and 30 days are visually highlighted | Should |
| AC-013 | The dashboard displays accuracy breakdown per quiz type (Name the Class, Match Drug to Class, Brand/Generic Match, Quick 5) | Must |
| AC-014 | Authenticated users see stats computed from full cloud history via `GET /api/stats` | Must |
| AC-015 | Unauthenticated users see stats computed from localStorage, limited to last 14 days | Must |
| AC-016 | Unauthenticated users see a sign-in CTA: "Sign in to unlock your full history and sync across devices" | Must |
| AC-017 | The dashboard works in both light and dark mode | Must |
| AC-018 | The dashboard is responsive (mobile and desktop) | Must |
| AC-019 | The accuracy trend chart uses SVG (no external charting library) | Should |
| AC-020 | Empty state: if no quizzes completed, show "Complete your first quiz to see your progress" | Must |
| AC-021 | The `GET /api/stats` endpoint is authenticated (401 without JWT) | Must |
| AC-022 | The `GET /api/stats` endpoint accepts an optional `days` query param to filter by time range | Should |
| AC-023 | Streak is computed from session timestamps (no new DB table) | Must |

## 3. User Test Cases

### TC-001: Authenticated user views progress dashboard

**Precondition:** User is signed in and has completed 10+ quizzes over several days
**Steps:**
1. Open Rx Drill
2. Click "My Progress" on the quiz config screen
**Expected Result:** Dashboard shows overall accuracy %, trend chart (defaulting to 30 days), top weak/strong classes, total quizzes, total questions, current streak, and quiz type breakdown. All data sourced from cloud.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-01-authenticated.png
**Maps to:** TBD

### TC-002: Time range switching on trend chart

**Precondition:** Dashboard is open, authenticated user
**Steps:**
1. Click "7 days" tab on the trend chart
2. Click "All time" tab
**Expected Result:** Chart updates to show the selected time range. Data points reflect only sessions within the range.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-02-time-range.png
**Maps to:** TBD

### TC-003: Unauthenticated user sees limited stats + CTA

**Precondition:** User is NOT signed in, has 5 sessions in localStorage
**Steps:**
1. Click "My Progress"
**Expected Result:** Dashboard shows stats from last 14 days only. A sign-in CTA banner appears: "Sign in to unlock your full history and sync across devices."
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-03-unauth-cta.png
**Maps to:** TBD

### TC-004: Empty state

**Precondition:** User has no completed quizzes
**Steps:**
1. Click "My Progress"
**Expected Result:** Dashboard shows "Complete your first quiz to see your progress" with a button to start a quiz.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-04-empty.png
**Maps to:** TBD

### TC-005: Streak display

**Precondition:** User has quizzed for 7 consecutive days
**Steps:**
1. Open "My Progress"
**Expected Result:** Streak shows "7 days" with the 7-day milestone highlighted. Previous milestones (3 days) also marked as achieved.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-05-streak.png
**Maps to:** TBD

### TC-006: Dark mode

**Precondition:** Device is in dark mode
**Steps:**
1. Open "My Progress"
**Expected Result:** All cards, charts, and text render with dark mode colors and sufficient contrast.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-06-dark-mode.png
**Maps to:** TBD

### TC-007: Mobile responsive

**Precondition:** Viewport width < 640px
**Steps:**
1. Open "My Progress"
**Expected Result:** Cards stack vertically, chart is scrollable or resizes, text remains readable.
**Screenshot Checkpoint:** tests/screenshots/progress-dashboard/step-07-mobile.png
**Maps to:** TBD

### TC-008: Back navigation

**Precondition:** Dashboard is open
**Steps:**
1. Click "Back" button
**Expected Result:** Returns to quiz config screen.
**Maps to:** TBD

## 4. Data Model

### StatsResponse (from GET /api/stats)

| Field | Type | Description |
|-------|------|-------------|
| overallAccuracy | number | Lifetime correct/total percentage (0-100) |
| totalQuizzes | number | Total completed quiz sessions |
| totalQuestions | number | Total questions answered |
| currentStreak | number | Consecutive days with at least one quiz |
| longestStreak | number | Best streak ever achieved |
| quizTypeBreakdown | QuizTypeStats[] | Accuracy per quiz type |
| weakestClasses | ClassStat[] | Bottom 5 classes by accuracy |
| strongestClasses | ClassStat[] | Top 5 classes by accuracy |
| trendData | TrendPoint[] | Accuracy per day for the requested range |

### QuizTypeStats

| Field | Type | Description |
|-------|------|-------------|
| quizType | string | Quiz type identifier |
| accuracy | number | Percentage (0-100) |
| count | number | Number of sessions of this type |

### ClassStat

| Field | Type | Description |
|-------|------|-------------|
| className | string | Drug class name |
| accuracy | number | Percentage (0-100) |
| totalSeen | number | Times this class appeared |

### TrendPoint

| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date (YYYY-MM-DD) |
| accuracy | number | Accuracy percentage for that day |
| count | number | Number of questions that day |

### localStorage (unauthenticated fallback)

Uses existing `dq-session-history` and `dq-drug-performance` keys. Stats computed client-side, limited to entries within last 14 days.

## 5. API Contract

### GET /api/stats

Compute and return quiz performance statistics for the authenticated user.

**Auth:** Required (JWT cookie)

**Query params:**
- `days` (optional, default: all) — filter to last N days (7, 30, or omit for all time)

**Response (200):**
```json
{
  "overallAccuracy": 74.5,
  "totalQuizzes": 42,
  "totalQuestions": 380,
  "currentStreak": 5,
  "longestStreak": 12,
  "quizTypeBreakdown": [
    { "quizType": "name-the-class", "accuracy": 78.2, "count": 18 },
    { "quizType": "match-drug-to-class", "accuracy": 71.0, "count": 12 },
    { "quizType": "brand-generic-match", "accuracy": 69.5, "count": 8 },
    { "quizType": "quick-5", "accuracy": 80.0, "count": 4 }
  ],
  "weakestClasses": [
    { "className": "Aminoglycoside Antibacterial", "accuracy": 33.3, "totalSeen": 6 },
    { "className": "Loop Diuretic", "accuracy": 40.0, "totalSeen": 5 }
  ],
  "strongestClasses": [
    { "className": "HMG-CoA Reductase Inhibitor", "accuracy": 100.0, "totalSeen": 8 },
    { "className": "ACE Inhibitor", "accuracy": 95.0, "totalSeen": 10 }
  ],
  "trendData": [
    { "date": "2026-04-11", "accuracy": 80.0, "count": 15 },
    { "date": "2026-04-10", "accuracy": 70.0, "count": 10 }
  ]
}
```

**Response (401):** Unauthorized

**Implementation notes:**
- `overallAccuracy`: `SUM(correct_count) / SUM(question_count) * 100` from `quiz_sessions`
- `currentStreak`: group sessions by date, count consecutive days backwards from today
- `weakestClasses` / `strongestClasses`: derived from `answers_json` JSONB field — each answer contains the drug class
- `trendData`: group by date, compute daily accuracy
- `days` param: `WHERE completed_at >= NOW() - INTERVAL '{days} days'`

## 6. UI Behavior

### Quiz Config Screen

- New "My Progress" button below session history (or alongside Quick 5)
- Icon: chart/bar-chart icon
- Always visible (auth and unauth)

### Dashboard Screen

**Layout (desktop):**
```
┌─────────────────────────────────────────────────┐
│  ← Back              My Progress                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │  74.5%  │ │   42    │ │  380    │ │ 🔥 5  │ │
│  │ Accuracy│ │ Quizzes │ │Questions│ │ Streak│ │
│  └─────────┘ └─────────┘ └─────────┘ └───────┘ │
│                                                 │
│  Accuracy Trend          [7d] [30d] [All]       │
│  ┌─────────────────────────────────────────┐    │
│  │         📈 SVG line chart               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌──────────────────┐ ┌──────────────────┐      │
│  │  Weakest Classes │ │ Strongest Classes│      │
│  │  1. Aminoglycos..│ │ 1. HMG-CoA Redu.│      │
│  │  2. Loop Diuretic│ │ 2. ACE Inhibitor│      │
│  │  3. ...          │ │ 3. ...          │      │
│  └──────────────────┘ └──────────────────┘      │
│                                                 │
│  Quiz Type Breakdown                            │
│  ┌─────────────────────────────────────────┐    │
│  │ Name the Class       ████████░░ 78%     │    │
│  │ Match Drug to Class  ███████░░░ 71%     │    │
│  │ Brand/Generic Match  ██████░░░░ 70%     │    │
│  │ Quick 5              █████████░ 80%     │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Sign in CTA — only if unauthenticated]        │
└─────────────────────────────────────────────────┘
```

**Layout (mobile < 640px):** Cards in 2x2 grid → stack to 2 columns, chart full width, class lists stack vertically.

### States

- **Loading:** Spinner while fetching `/api/stats`
- **Empty:** "Complete your first quiz to see your progress" + "Start Quiz" button
- **Error:** "Could not load your stats. Try again later." + retry button
- **Unauthenticated:** 14-day stats + sign-in CTA banner at bottom

### Streak Milestones

| Days | Label | Visual |
|------|-------|--------|
| 3 | 🔥 3-day streak | Bronze ring |
| 7 | 🔥 7-day streak | Silver ring |
| 14 | 🔥 14-day streak | Gold ring |
| 30 | 🔥 30-day streak | Diamond ring |

Current milestone highlighted, previous milestones shown as achieved (checkmarks).

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Full dashboard, authenticated | tests/screenshots/progress-dashboard/step-01-full.png |
| 2 | Time range switching | tests/screenshots/progress-dashboard/step-02-range.png |
| 3 | Unauthenticated with CTA | tests/screenshots/progress-dashboard/step-03-unauth.png |
| 4 | Empty state | tests/screenshots/progress-dashboard/step-04-empty.png |
| 5 | Streak milestones | tests/screenshots/progress-dashboard/step-05-streak.png |
| 6 | Dark mode | tests/screenshots/progress-dashboard/step-06-dark.png |
| 7 | Mobile layout | tests/screenshots/progress-dashboard/step-07-mobile.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User has only 1 session | Show stats, trend chart has single data point |
| User has sessions only today | Streak = 1, trend chart shows 1 day |
| User missed yesterday | Streak = 0 (or 1 if they already quizzed today), show "Start a new streak!" |
| No drug class data in answers_json | Weakest/strongest classes show "Not enough data yet" |
| Migrated sessions (from localStorage) have empty answers_json | Excluded from class-level stats, included in accuracy/count stats |
| Very long class names | Truncate with ellipsis in the UI |
| 100% accuracy on all classes | Strongest shows top 5, weakest shows "No weak areas — great work!" |
| Network error on /api/stats | Show error state with retry button |
| Unauthenticated user has 0 sessions in last 14 days | Show empty state (not the 14-day limited view) |

## 8. Dependencies

- `quiz_sessions` table — existing, has `completed_at`, `quiz_type`, `correct_count`, `question_count`, `answers_json`
- `useSessionHistory` hook — existing, provides localStorage sessions for unauthenticated path
- `useDrugPerformance` hook — existing, has per-drug accuracy for unauthenticated class-level stats
- Auth middleware — existing, protects `/api/stats`
- No new DB tables or migrations
- No external charting libraries — SVG chart built in-house

## 9. Out of Scope

- Historical comparison ("you improved 5% this week vs last week")
- Social comparison ("you're in the top 10% of users")
- Downloadable reports / PDF export
- Push notifications for streak reminders
- Detailed per-question review from the dashboard
- Achievement badges (separate spec, cycle 13)

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-04-12 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
