# Spec: Achievement Badges

**Version:** 0.1.0
**Created:** 2026-04-18
**PRD Reference:** docs/prd.md (M7: Study Experience)
**Milestone:** M7 — Study Experience
**Status:** Draft

## 1. Overview

A badge/achievement system displayed on the progress dashboard. Users earn badges by reaching milestones (quiz count, streaks, mastery). Unauthenticated users can earn 3 starter badges; the remaining 7 require an account, driving sign-ups. Unearned badges show locked with progress hints. A toast notification celebrates each new badge earned.

### User Story

As a pharmacy student, I want to earn badges for my quiz achievements so that I feel motivated to keep studying and can track my accomplishments.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | An "Achievements" section appears on the progress dashboard below existing stats | Must |
| AC-002 | 10 badges are defined and displayable | Must |
| AC-003 | Earned badges show in full color with the badge icon and name | Must |
| AC-004 | Unearned badges show greyed/locked with a lock icon | Must |
| AC-005 | Unearned badges show progress hint text (e.g., "12/50 questions") | Must |
| AC-006 | A count shows total earned (e.g., "3/10 earned") | Must |
| AC-007 | Unauthenticated users can only earn 3 badges: First Quiz, 3-Day Streak, 7-Day Streak | Must |
| AC-008 | Remaining 7 badges show as "Sign in to unlock" for unauthenticated users | Must |
| AC-009 | CTA on the achievements section for unauthenticated users: "Sign in to unlock 7 more badges and sync your progress" | Must |
| AC-010 | When a badge is newly earned, a toast notification appears: "🏅 New badge: {badge name}!" | Must |
| AC-011 | Toast auto-dismisses after 3 seconds | Must |
| AC-012 | Badge criteria are checked after each quiz completion | Must |
| AC-013 | Badge earned state persists in localStorage (unauthenticated) or via /api/stats (authenticated) | Must |
| AC-014 | Badges work in both light and dark mode | Must |
| AC-015 | Badges section is responsive (grid adapts to mobile) | Should |
| AC-016 | Badge data is included in the GET /api/stats response for authenticated users | Must |

## 3. Badge Catalog

| # | Badge | Icon | Criteria | Unauth Available |
|---|-------|------|----------|-----------------|
| 1 | First Quiz | 🎯 | Complete 1 quiz | Yes |
| 2 | Perfect Score | 💯 | Score 100% on any quiz | No |
| 3 | 50 Questions | 📝 | Answer 50 questions total | No |
| 4 | 500 Questions | 📝 | Answer 500 questions total | No |
| 5 | 3-Day Streak | 🔥 | 3 consecutive days with a quiz | Yes |
| 6 | 7-Day Streak | 🔥 | 7 consecutive days with a quiz | Yes |
| 7 | 14-Day Streak | 🔥 | 14 consecutive days with a quiz | No |
| 8 | 30-Day Streak | 🔥 | 30 consecutive days with a quiz | No |
| 9 | Class Master | 🧠 | 100% accuracy on all drugs in a single class (min 5 drugs seen) | No |
| 10 | Speed Demon | ⚡ | Average under 5 seconds per question in a timed quiz | No |

## 4. User Test Cases

### TC-001: First badge earned after first quiz

**Precondition:** New user, no quizzes completed
**Steps:**
1. Complete a 5-question quiz
**Expected Result:** Toast appears: "🏅 New badge: First Quiz!" Auto-dismisses after 3 seconds. Dashboard shows badge 1/10 earned.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-01-first-badge.png
**Maps to:** TBD

### TC-002: Earned badges display on dashboard

**Precondition:** User has earned First Quiz and 3-Day Streak
**Steps:**
1. Open My Progress
**Expected Result:** Achievements section shows 2 earned badges in color, 8 locked/greyed. Counter shows "2/10 earned". Locked badges show progress hints.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-02-dashboard.png
**Maps to:** TBD

### TC-003: Unauthenticated user sees limited badges

**Precondition:** User is NOT signed in
**Steps:**
1. Open My Progress → Achievements section
**Expected Result:** 3 badges available (First Quiz, 3-Day Streak, 7-Day Streak). Other 7 show "Sign in to unlock". CTA banner: "Sign in to unlock 7 more badges and sync your progress."
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-03-unauth.png
**Maps to:** TBD

### TC-004: Perfect Score badge

**Precondition:** Authenticated user, no Perfect Score badge yet
**Steps:**
1. Complete a quiz with 100% score
**Expected Result:** Toast: "🏅 New badge: Perfect Score!" Badge appears earned on dashboard.
**Maps to:** TBD

### TC-005: Progress hints on locked badges

**Precondition:** User has answered 30 questions total
**Steps:**
1. Open My Progress
**Expected Result:** "50 Questions" badge shows locked with hint "30/50 questions".
**Maps to:** TBD

### TC-006: Speed Demon badge

**Precondition:** User completes a timed quiz with average < 5s per question
**Steps:**
1. Complete a timed quiz quickly
**Expected Result:** Toast: "🏅 New badge: Speed Demon!" Badge earned on dashboard.
**Maps to:** TBD

## 5. Data Model

### BadgeDefinition (static, frontend)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique badge ID (e.g., "first-quiz", "perfect-score") |
| name | string | Display name |
| icon | string | Emoji icon |
| description | string | How to earn it |
| requiresAuth | boolean | Whether sign-in is required |

### BadgeProgress (computed)

| Field | Type | Description |
|-------|------|-------------|
| badgeId | string | References BadgeDefinition.id |
| earned | boolean | Whether the badge has been earned |
| earnedAt | string | null | ISO date when earned |
| progress | string | null | Progress hint text (e.g., "30/50") |
| progressPercent | number | 0-100 progress percentage |

### API Extension: GET /api/stats response

Add a `badges` field to the existing stats response:

```json
{
  "badges": [
    { "badgeId": "first-quiz", "earned": true, "earnedAt": "2026-04-01" },
    { "badgeId": "perfect-score", "earned": false, "progress": "Best: 90%", "progressPercent": 90 },
    { "badgeId": "50-questions", "earned": false, "progress": "30/50", "progressPercent": 60 }
  ]
}
```

### localStorage (unauthenticated)

| Key | Type | Description |
|-----|------|-------------|
| `dq-badges-earned` | JSON array | Array of `{ badgeId, earnedAt }` for the 3 available unauth badges |

## 6. UI Behavior

### Achievements Section (on Progress Dashboard)

```
┌─────────────────────────────────────────┐
│  Achievements                    3/10   │
│                                         │
│  🎯         💯         📝         📝   │
│  First     Perfect   50 Qs      500 Qs  │
│  Quiz ✓   Score 🔒  30/50 🔒   30/500 🔒│
│                                         │
│  🔥         🔥         🔥         🔥   │
│  3-Day ✓  7-Day ✓   14-Day 🔒  30-Day 🔒│
│                                         │
│  🧠         ⚡                          │
│  Class     Speed                        │
│  Master 🔒 Demon 🔒                     │
│                                         │
│  [Sign in to unlock 7 more badges]      │
└─────────────────────────────────────────┘
```

- Grid: 4 columns desktop, 3 columns mobile
- Earned: full color emoji, name, green checkmark
- Locked: greyed, lock icon, progress hint below
- Auth-locked: "Sign in to unlock" instead of progress

### Toast Notification

- Position: top-center, overlays content
- Style: rounded pill, green background, white text, badge emoji
- Content: "🏅 New badge: {name}!"
- Duration: 3 seconds, fade out
- Max 1 toast at a time (queue if multiple badges earned simultaneously)

### States

- **Loading:** Spinner while fetching stats (existing dashboard behavior)
- **Empty:** "Complete your first quiz to start earning badges"
- **Partially earned:** Mix of colored + greyed badges
- **All earned:** "🎉 All badges earned! You're a pharmacy master!"

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User earns multiple badges in one quiz | Show toasts sequentially (1 second gap) |
| User re-earns a badge (already earned) | No toast, no change |
| Speed Demon on non-timed quiz | Not applicable — requires timed mode |
| Class Master with < 5 drugs seen in any class | Badge stays locked, progress shows drugs seen count |
| User signs in after earning unauth badges | Merge: unauth badges carry over to cloud |
| localStorage cleared | Unauth badges lost; re-earn from current session data |
| answersJson is empty (migrated sessions) | Skip those sessions for badge criteria that need answer details |

## 8. Dependencies

- Progress Dashboard (done — v0.6.0)
- `GET /api/stats` endpoint (done — needs `badges` field added)
- `useDrugPerformance` hook (existing — for Class Master)
- Toast component (new — or reuse existing "Copied!" pattern)

## 9. Out of Scope

- Badge sharing to social media (documented in PRD as future work)
- Custom/user-created badges
- Badge levels (bronze/silver/gold tiers)
- Leaderboard integration
- Push notifications for badge milestones

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-04-18 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
