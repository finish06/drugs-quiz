# Spec: achievements-badges

**Version:** 0.1.0
**Created:** 2026-04-14
**PRD Reference:** docs/prd.md (M7 — Study Experience)
**Milestone:** M7-Study-Experience (cycle 13)
**Status:** Approved (UX signed off — see specs/ux/achievements-badges-ux.md)

## 1. Overview

Award visual badges when users hit meaningful milestones — first 100%, streaks, mastery of a drug class — so they feel rewarded and motivated to return. Five badges ship at launch; a catalog in code makes adding more trivial.

### User Story

As a pharmacy student studying for NAPLEX/PTCE on Rx Drill, I want visible proof of my progress and milestones, so that I stay motivated to keep studying and return tomorrow.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Five launch badges exist in a static catalog: First Quiz, Perfect Score, Class Master, Centurion, Streak Seeker — each with id, name, description, unlock criteria, and icon | Must |
| AC-002 | "First Quiz" unlocks on completion of any quiz session | Must |
| AC-003 | "Perfect Score" unlocks on completion of a quiz with score 100% and at least 5 questions | Must |
| AC-004 | "Class Master" unlocks when the user answers correctly for every drug in a single pharmacological class (across any sessions), context stores the class name | Must |
| AC-005 | "Centurion" unlocks when cumulative answered-question count reaches 100 | Must |
| AC-006 | "Streak Seeker" unlocks when the user has completed at least one quiz on 7 consecutive calendar days (using server timestamps, UTC) | Must |
| AC-007 | Badge unlock evaluation runs server-side in `POST /api/achievements/check` after a session has been persisted; client does not decide unlocks for authenticated users | Must |
| AC-008 | Badge persistence uses the `achievements` table with a unique constraint on `(user_id, badge_id)`; duplicate unlocks are silently ignored | Must |
| AC-009 | `GET /api/achievements` returns the authenticated user's earned badges as `[{badgeId, earnedAt, context}]` | Must |
| AC-010 | Unauthenticated users earn badges locally; the catalog and unlock logic are evaluated in the browser and persisted to `localStorage` under key `rxdrill:achievements:v1` | Must |
| AC-011 | On first sign-in after earning guest badges, `POST /api/achievements/migrate` imports them into the database (idempotent); no badge is lost | Must |
| AC-012 | The QuizResults screen displays a badge-unlock toast for each newly-earned badge in that session, auto-dismissing after 5 seconds; multiple unlocks are stacked | Must |
| AC-013 | A Badges page (linked from the user menu) displays all badges: earned ones in color with earn-date, unearned ones greyed out with unlock criteria shown | Must |
| AC-014 | The progress dashboard shows a "Recent Badges" widget with the last 3 earned badges, linking to the full page | Should |
| AC-015 | Streak computation uses server timestamps only (no client clock), preventing timezone drift or client-side manipulation | Must |
| AC-016 | Network failure during unlock does not block UX: client still toasts; the unlock is queued in localStorage and retried on the next successful API call | Should |
| AC-017 | Umami analytics emit `badge_unlocked` (with badgeId) on unlock and `badges_viewed` on Badges page load | Should |
| AC-018 | All badge icons and toasts expose accessible names (`aria-label`); toasts use `role="status"` and are keyboard-dismissable | Must |
| AC-019 | Test coverage for branches remains ≥ 78% after this feature lands | Must |
| AC-020 | No regression in the existing test suite | Must |

## 3. User Test Cases

### TC-001: First Quiz badge on first-ever completion

**Precondition:** Authenticated user with no prior quiz_sessions and no achievements.
**Steps:**
1. Start any quiz from QuizConfig
2. Answer all questions (any score)
3. View QuizResults
**Expected Result:** An unlock toast appears showing "First Quiz unlocked" with the badge icon. The toast auto-dismisses after 5s. Navigating to the Badges page shows First Quiz as earned with today's date.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-01-first-quiz-toast.png
**Maps to:** TBD

### TC-002: Perfect Score badge toast with stacked unlocks

**Precondition:** Authenticated user with First Quiz already earned; has answered 99 total questions across prior sessions.
**Steps:**
1. Start a 5-question quiz
2. Answer all 5 correctly (triggers both Perfect Score and Centurion)
3. View QuizResults
**Expected Result:** Two unlock toasts appear (Perfect Score and Centurion), stacked or shown sequentially. Both are recorded in the database on a single `POST /api/achievements/check`.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-02-stacked-unlocks.png
**Maps to:** TBD

### TC-003: Class Master unlocks after covering all drugs in a class

**Precondition:** Authenticated user has answered correctly for every drug in the "Beta Blocker" class across multiple sessions, except one remaining drug.
**Steps:**
1. Play a quiz that includes the last remaining Beta Blocker
2. Answer it correctly
3. Complete the session
**Expected Result:** Class Master unlocks with `context_json = {"className": "Beta Blocker"}`. Toast shows "Class Master — Beta Blocker unlocked".
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-03-class-master.png
**Maps to:** TBD

### TC-004: Streak Seeker requires 7 consecutive server days

**Precondition:** Authenticated user has completed exactly one quiz on each of the prior 6 consecutive UTC days (seeded via test fixtures with server timestamps). No badge yet earned.
**Steps:**
1. On day 7 (today, server time), complete any quiz
2. View QuizResults
**Expected Result:** Streak Seeker unlocks. If the user instead skipped a day (e.g., missed day 4), no unlock occurs — streak restarts.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-04-streak-seeker.png
**Maps to:** TBD

### TC-005: Guest earns badges, signs in, badges migrate

**Precondition:** Unauthenticated visitor with no localStorage achievements.
**Steps:**
1. As guest, complete 2 quizzes (unlocks First Quiz; may unlock Perfect Score)
2. Open Badges page — see earned badges from localStorage + sign-in banner
3. Sign in via Google OAuth
4. Open Badges page again
**Expected Result:** After sign-in, the client posts localStorage badges to `POST /api/achievements/migrate`. Badges page now reflects database state with the same badges earned (same earnedAt timestamps). Sign-in banner is gone.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-05-guest-migrate.png
**Maps to:** TBD

### TC-006: Badges page empty state for brand-new user

**Precondition:** Authenticated user with zero earned achievements.
**Steps:**
1. Navigate to Badges page
**Expected Result:** All 5 badges shown greyed out with unlock criteria. Encouragement line: "Complete a quiz to earn your first badge!"
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-06-badges-empty.png
**Maps to:** TBD

### TC-007: Badges page populated, earned-first ordering

**Precondition:** Authenticated user with 2 badges earned (First Quiz, Perfect Score).
**Steps:**
1. Navigate to Badges page
**Expected Result:** First Quiz and Perfect Score shown in color with earn-dates at the top; Class Master / Centurion / Streak Seeker shown greyed out below with criteria.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-07-badges-populated.png
**Maps to:** TBD

### TC-008: Duplicate unlock is idempotent

**Precondition:** Authenticated user already has Perfect Score earned.
**Steps:**
1. Complete another 100% quiz
2. Inspect `POST /api/achievements/check` response
3. Reload Badges page
**Expected Result:** Response includes no newly-unlocked badges (the duplicate insert silently no-ops via `ON CONFLICT DO NOTHING`). Only one Perfect Score row exists in the database. No duplicate toast.
**Screenshot Checkpoint:** tests/screenshots/achievements-badges/step-08-idempotent.png
**Maps to:** TBD

## 4. Data Model

### achievements (new table)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key, default `gen_random_uuid()` |
| user_id | UUID | Yes | FK → `users.id`, indexed |
| badge_id | varchar(64) | Yes | Catalog id, e.g. `"perfect-score"` |
| earned_at | timestamp | Yes | Server-set on insert |
| context_json | jsonb | No | Unlock context, e.g. `{"className": "Beta Blocker", "sessionId": "..."}` for Class Master |

**Indexes:** `idx_achievements_user_id` on `user_id`. **Unique constraint:** `uq_achievements_user_badge` on `(user_id, badge_id)`.

### Badge catalog (in-code, `src/data/badges.ts`)

```ts
type BadgeDef = {
  id: string;        // "first-quiz" | "perfect-score" | "class-master" | "centurion" | "streak-seeker"
  name: string;
  description: string;
  criteria: string;  // human-readable unlock description
  icon: string;      // lucide-react icon name
};
```

### localStorage shape (guests)

```
Key: "rxdrill:achievements:v1"
Value: { [badgeId: string]: earnedAtISOString }
```

### Streak computation

Derived from existing `quiz_sessions.completed_at`. Query: count consecutive UTC days with at least one completed session, ending at today or yesterday (server time). No new storage.

### Relationships

- `achievements.user_id` → `users.id` (cascade delete if user is removed)
- Badge catalog is compile-time data; not a DB entity.

## 5. API Contract

### GET /api/achievements

**Description:** Return earned badges for the authenticated user.

**Auth:** Required (JWT cookie).

**Response (200):**
```json
[
  {
    "badgeId": "first-quiz",
    "earnedAt": "2026-04-14T18:02:11.000Z",
    "context": null
  },
  {
    "badgeId": "class-master",
    "earnedAt": "2026-04-13T11:45:00.000Z",
    "context": { "className": "Beta Blocker" }
  }
]
```

**Error Responses:**
- `401` — not authenticated

### POST /api/achievements/check

**Description:** Evaluate unlock criteria for the authenticated user after a session save. Returns any newly-unlocked badges.

**Auth:** Required.

**Request:**
```json
{ "sessionId": "a3f1c0e2-..." }
```

**Response (200):**
```json
{
  "unlocked": [
    { "badgeId": "perfect-score", "earnedAt": "2026-04-14T18:02:11.000Z", "context": null }
  ]
}
```

**Error Responses:**
- `400` — sessionId missing or not owned by user
- `401` — not authenticated
- `404` — session not found

### POST /api/achievements/migrate

**Description:** Bulk-import guest-earned badges on first sign-in. Idempotent via unique constraint.

**Auth:** Required.

**Request:**
```json
{
  "badges": [
    { "badgeId": "first-quiz", "earnedAt": "2026-04-13T10:00:00.000Z" },
    { "badgeId": "perfect-score", "earnedAt": "2026-04-13T10:05:00.000Z" }
  ]
}
```

**Response (200):**
```json
{ "imported": 2, "skipped": 0 }
```

**Error Responses:**
- `400` — unknown badgeId or malformed payload
- `401` — not authenticated

## 6. UI Behavior

### States

- **Loading:** Badges page shows a skeleton grid of 5 placeholders.
- **Empty:** All 5 badges greyed out with criteria text; encouragement line ("Complete a quiz to earn your first badge!").
- **Error:** Inline error message with retry button if `GET /api/achievements` fails.
- **Success:** Earned badges shown in color with earn-date formatted locally; unearned greyed out with criteria. Earned badges sort to the top.
- **Guest:** Same visuals, plus a banner ("Sign in to keep your badges across devices").

### Unlock toast (on QuizResults)

- Position: `fixed top-4 right-4` (on mobile: `top-4 left-2 right-2` for full width minus gutter).
- Appears after results render, once per newly-earned badge.
- Shows lucide-react icon + name ("Perfect Score unlocked!").
- Auto-dismiss after 5s; click or Esc to dismiss.
- Multiple unlocks stack vertically with a 300ms stagger between each.
- Container uses `role="status"` and `aria-live="polite"` for assistive tech.

### Badges page grid

- Two sections: **Earned** (colored, earn-date shown) and **Locked** (greyed, criteria shown).
- Grid: `grid grid-cols-2 lg:grid-cols-3 gap-4` (2-col on small/medium, 3-col at Tailwind `lg:` breakpoint ≥1024px).
- Cards: `rounded-2xl p-4`. Earned cards get `ring-1 ring-accent/30`.

### Progress dashboard widget

- "Recent Badges" card showing last 3 earned badges with icons + names.
- Links to the full Badges page.

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | QuizResults with First Quiz unlock toast | tests/screenshots/achievements-badges/step-01-first-quiz-toast.png |
| 2 | QuizResults with stacked unlocks (Perfect Score + Centurion) | tests/screenshots/achievements-badges/step-02-stacked-unlocks.png |
| 3 | Class Master unlock toast with className context | tests/screenshots/achievements-badges/step-03-class-master.png |
| 4 | Streak Seeker unlocked on day 7 | tests/screenshots/achievements-badges/step-04-streak-seeker.png |
| 5 | Guest badges migrate to account on sign-in | tests/screenshots/achievements-badges/step-05-guest-migrate.png |
| 6 | Badges page empty state (brand-new user) | tests/screenshots/achievements-badges/step-06-badges-empty.png |
| 7 | Badges page populated (2 earned, 3 locked) | tests/screenshots/achievements-badges/step-07-badges-populated.png |
| 8 | Idempotent duplicate unlock (no second row) | tests/screenshots/achievements-badges/step-08-idempotent.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Session save fails | No `/achievements/check` call is made; user retries normally. No partial unlock. |
| `/achievements/check` network failure (authenticated) | Client queues unlock-check in localStorage; retries on next API success. Toast still shows if client has already computed optimistic unlocks. |
| Duplicate unlock attempt | `INSERT ... ON CONFLICT (user_id, badge_id) DO NOTHING`. Response lists only truly-new unlocks. No duplicate toast. |
| Guest → auth sign-in with conflicting earnedAt | `ON CONFLICT DO NOTHING` keeps whichever row exists first. Earlier earn-date wins; guest badge is not lost. |
| Stale localStorage for authenticated user | On Badges page load, server state overwrites local cache. DB is source of truth for authenticated users. |
| Timezone drift / client clock manipulation | Streak computation uses server timestamps on `quiz_sessions.completed_at`, grouped by UTC date. Client clock never consulted for streak. |
| User deletes account | Cascade deletes `achievements` rows. |
| Catalog badge removed in future release | DB rows for removed badgeId persist but render as "unknown badge" or are filtered out; documented in migration notes. |
| Class Master where class has only 1 drug | Acceptable — unlock still requires correct answer on that drug. Low-frequency edge case, no special handling. |
| Quiz with <5 questions scoring 100% | Perfect Score does NOT unlock (guard clause — prevents trivial 1-question quizzes from cheesing the badge). |

## 8. Dependencies

- **Frontend:** `lucide-react` — **new dependency** to add. Icons used: `Trophy`, `Target`, `Award`, `Medal`, `Flame`. Tree-shaken; expected bundle delta <5KB.
- **Backend:** Drizzle ORM + Postgres (existing). New migration file in `bff/drizzle/`.
- **Analytics:** Umami client already integrated (used by analytics-events spec).
- **Feature dependencies:** requires M5 (auth + cloud sessions) ✅ complete; reads from existing `quiz_sessions` and `users` tables.

## 9. Infrastructure Prerequisites

| Category | Requirement |
|----------|-------------|
| Environment variables | N/A (uses existing DATABASE_URL, JWT_SECRET) |
| Registry images | N/A (uses existing `rxdrill-bff` + `rxdrill-app` images) |
| Cloud quotas | N/A |
| Network reachability | N/A (same-origin, no new external services) |
| CI status | Existing CI pipeline (lint, test, build, push, deploy) must run migrations successfully on staging before production |
| External secrets | N/A |
| Database migrations | New migration must auto-run on BFF startup via existing Drizzle auto-migrate pattern; staging verifies before prod tag |

**Verification before implementation:** Confirm `lucide-react` is installed (`grep lucide package.json`); confirm Drizzle auto-migration is active by reading `bff/src/db/migrate.ts`; run `npm run dev` and verify a fresh migration file applies cleanly to a local Postgres container.

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-04-14 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview (cycle 13) |
| 2026-04-14 | 0.1.1 | Caleb Dunn | UX signed off — lucide-react chosen, 2/3-col responsive grid, toast position/duration fixed. See specs/ux/achievements-badges-ux.md |
