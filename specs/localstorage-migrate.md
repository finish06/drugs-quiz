# Spec: localStorage Session Migration

**Version:** 0.1.0
**Created:** 2026-03-27
**PRD Reference:** docs/prd.md (M5: Go Social)
**Milestone:** M5 — Go Social: Accounts + Viral Distribution
**Status:** Complete

## 1. Overview

When a user signs in for the first time, migrate their localStorage session history to the cloud (quiz_sessions table). This converts anonymous local data into a persistent, device-independent account. After successful migration, localStorage session data is cleared to establish the database as the single source of truth.

### User Story

As a pharmacy student who has been using Rx Quiz without an account, I want my existing quiz history to transfer to my new account so that I don't lose my progress when I sign up.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | After first OAuth login, if localStorage contains session history (`dq-session-history`), a migration prompt appears | Must |
| AC-002 | The migration prompt shows a summary: "{N} quiz sessions found on this device. Sync to your account?" | Must |
| AC-003 | The prompt has "Sync Now" and "Skip" buttons | Must |
| AC-004 | Clicking "Sync Now" sends all localStorage sessions to the BFF via `POST /api/sessions/migrate` | Must |
| AC-005 | The BFF endpoint validates each session record and inserts valid records into `quiz_sessions` | Must |
| AC-006 | Duplicate sessions (same completedAt timestamp + quizType for the same user) are silently skipped, not rejected | Must |
| AC-007 | After successful migration, `dq-session-history` is cleared from localStorage | Must |
| AC-008 | After successful migration, a success message appears: "Synced {N} sessions to your account" | Must |
| AC-009 | Clicking "Skip" dismisses the prompt without migrating; a flag is set so the prompt does not reappear in this session | Should |
| AC-010 | If the user skips, the prompt reappears on next login (until they sync or localStorage is empty) | Should |
| AC-011 | The migration prompt only appears when the user is authenticated AND localStorage has session data | Must |
| AC-012 | If migration partially fails (some sessions invalid), successfully migrated sessions are still saved and localStorage is still cleared | Should |
| AC-013 | The migration prompt works in both light and dark mode | Must |
| AC-014 | The prompt appears as a modal overlay, not a banner, to ensure user attention on first login | Must |
| AC-015 | After migration, the session history on the quiz config screen reads from the database (via `GET /api/sessions`) instead of localStorage | Must |
| AC-016 | Unauthenticated users continue to use localStorage for session history (no behavior change) | Must |
| AC-017 | The `GET /api/sessions` endpoint returns the user's sessions ordered by `completedAt` descending, limited to 10 | Must |
| AC-018 | Personal best calculation works with cloud-sourced sessions (same logic, different data source) | Must |

## 3. User Test Cases

### TC-001: First login triggers migration prompt

**Precondition:** User has 5 sessions in localStorage, has never logged in
**Steps:**
1. Click "Sign in with Google"
2. Complete OAuth flow
3. App redirects back
**Expected Result:** Modal appears: "5 quiz sessions found on this device. Sync to your account?" with "Sync Now" and "Skip" buttons.
**Screenshot Checkpoint:** tests/screenshots/localstorage-migrate/step-01-prompt.png
**Maps to:** AC-001, AC-002, AC-003, AC-014

### TC-002: Sync Now migrates sessions

**Precondition:** Migration prompt is visible (TC-001)
**Steps:**
1. Click "Sync Now"
**Expected Result:** Sessions are sent to the server. Success message: "Synced 5 sessions to your account". localStorage `dq-session-history` is now empty. Session history on config screen shows the migrated sessions.
**Screenshot Checkpoint:** tests/screenshots/localstorage-migrate/step-02-success.png
**Maps to:** AC-004, AC-007, AC-008, AC-015

### TC-003: Skip dismisses prompt

**Precondition:** Migration prompt is visible
**Steps:**
1. Click "Skip"
**Expected Result:** Prompt disappears. Session history continues showing localStorage data. No data is sent to the server.
**Screenshot Checkpoint:** tests/screenshots/localstorage-migrate/step-03-skip.png
**Maps to:** AC-009

### TC-004: Skip prompt reappears on next login

**Precondition:** User previously skipped migration, still has localStorage sessions
**Steps:**
1. Log out
2. Log in again
**Expected Result:** Migration prompt appears again.
**Maps to:** AC-010

### TC-005: No prompt when localStorage is empty

**Precondition:** User has no session history in localStorage
**Steps:**
1. Sign in with Google
**Expected Result:** No migration prompt appears. User lands on quiz config screen normally.
**Maps to:** AC-011

### TC-006: Authenticated user sees cloud sessions

**Precondition:** User has migrated sessions or completed quizzes while logged in
**Steps:**
1. View quiz config screen
**Expected Result:** Session history and personal best are sourced from the database, not localStorage.
**Screenshot Checkpoint:** tests/screenshots/localstorage-migrate/step-06-cloud-history.png
**Maps to:** AC-015, AC-018

### TC-007: Unauthenticated user unchanged

**Precondition:** User is not logged in, has localStorage sessions
**Steps:**
1. View quiz config screen
**Expected Result:** Session history displays from localStorage as before. No migration prompt. No API calls to `/api/sessions`.
**Maps to:** AC-016

## 4. Data Model

### Existing: localStorage SessionRecord

```typescript
interface SessionRecord {
  id: string;
  completedAt: string;        // ISO timestamp
  quizType: SessionQuizType;  // 'name-the-class' | 'match-drug-to-class' | 'brand-generic-match' | 'quick-5'
  questionCount: number;
  correctCount: number;
  percentage: number;
  timedMode?: boolean;
  timeLimitSeconds?: number;
}
```

localStorage key: `dq-session-history` (JSON array, max 10 entries)

### Existing: quiz_sessions table

```sql
quiz_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_type   quiz_type_enum NOT NULL,
  question_count INTEGER NOT NULL,
  correct_count  INTEGER NOT NULL,
  percentage  REAL NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  answers_json JSONB NOT NULL
)
```

### Migration Mapping

| localStorage field | quiz_sessions column | Notes |
|-------------------|---------------------|-------|
| — | id | New UUID generated server-side |
| — | user_id | From authenticated JWT |
| quizType | quiz_type | Direct mapping |
| questionCount | question_count | Direct mapping |
| correctCount | correct_count | Direct mapping |
| percentage | percentage | Direct mapping |
| completedAt | completed_at | Parse ISO string to timestamp |
| — | answers_json | Set to `[]` (localStorage doesn't store per-question answers) |

Fields `timedMode` and `timeLimitSeconds` are not stored in the DB schema — they are dropped during migration.

## 5. API Contract

### POST /api/sessions/migrate

Bulk-import localStorage sessions for the authenticated user.

**Auth:** Required (JWT cookie)

**Request:**
```json
{
  "sessions": [
    {
      "quizType": "name-the-class",
      "questionCount": 10,
      "correctCount": 8,
      "percentage": 80,
      "completedAt": "2026-03-20T14:30:00.000Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "migrated": 5,
  "skipped": 0
}
```

**Response (401):** Unauthorized
**Response (400):** Invalid request body

**Validation:**
- `quizType` must be one of the 4 valid enum values
- `questionCount` must be a positive integer
- `correctCount` must be >= 0 and <= questionCount
- `percentage` must be 0–100
- `completedAt` must be a valid ISO 8601 timestamp, not in the future
- Max 50 sessions per request (prevent abuse)

### GET /api/sessions

List the authenticated user's quiz sessions.

**Auth:** Required (JWT cookie)

**Query params:**
- `limit` (optional, default 10, max 50)

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "quizType": "name-the-class",
      "questionCount": 10,
      "correctCount": 8,
      "percentage": 80,
      "completedAt": "2026-03-20T14:30:00.000Z"
    }
  ]
}
```

**Response (401):** Unauthorized

### POST /api/sessions

Save a single session after quiz completion (for authenticated users).

**Auth:** Required (JWT cookie)

**Request:**
```json
{
  "quizType": "name-the-class",
  "questionCount": 10,
  "correctCount": 8,
  "percentage": 80,
  "completedAt": "2026-03-20T14:30:00.000Z",
  "answersJson": [...]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "quizType": "name-the-class",
  "questionCount": 10,
  "correctCount": 8,
  "percentage": 80,
  "completedAt": "2026-03-20T14:30:00.000Z"
}
```

## 6. UI Behavior

### Migration Modal

- **Trigger:** After OAuth redirect, when AuthContext confirms `isAuthenticated` AND localStorage `dq-session-history` has entries
- **Appearance:** Centered modal with backdrop overlay
- **Content:**
  - Icon: cloud/sync icon
  - Heading: "Sync Your Quiz History"
  - Body: "{N} quiz sessions found on this device. Sync to your account so they're available everywhere."
  - Buttons: "Sync Now" (primary) | "Skip" (secondary/ghost)
- **Loading state:** "Sync Now" button shows spinner during API call, disabled to prevent double-click
- **Success state:** Modal content transitions to success message with checkmark, auto-dismisses after 2 seconds
- **Error state:** "Something went wrong. Your local data is safe — try again later." with "Dismiss" button
- **Dark mode:** Consistent with existing modal patterns

### Session History Source Switching

- **Unauthenticated:** `useSessionHistory` reads from localStorage (no change)
- **Authenticated:** `useSessionHistory` reads from `GET /api/sessions` instead
- The hook's interface remains the same — consumers don't know the data source

### New Quiz Session Saving (Authenticated)

- When an authenticated user completes a quiz, the result is saved via `POST /api/sessions` in addition to (or instead of) localStorage
- This ensures new sessions after migration go to the DB

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| localStorage has 0 sessions | No migration prompt shown |
| User completes OAuth but localStorage read fails | No migration prompt; fail silently |
| Migration API call fails (network error) | Show error message; localStorage preserved; user can retry next login |
| Duplicate sessions (user migrates, then somehow has old localStorage restored) | Server skips duplicates based on completedAt + quizType |
| User logs out after migration | Session history hidden (unauthenticated view shows nothing in localStorage since it was cleared) |
| Session has invalid data (e.g., percentage > 100) | Server skips that session, migrates the rest |
| User on multiple devices with different localStorage | Each device migrates independently; all sessions accumulate in DB |
| Concurrent migration from two tabs | Server handles with unique constraint; second tab's duplicates are skipped |

## 8. Dependencies

- `AuthContext` — must know when user just logged in for the first time
- `useSessionHistory` hook — needs to support dual data source (localStorage vs API)
- BFF auth middleware — protects new endpoints
- `quiz_sessions` table — already exists (from db-schema-orm spec)
- `users` table — already exists

## 9. Out of Scope

- Drug performance / spaced repetition data migration (stays in localStorage)
- Offline support / sync conflict resolution
- Batch export/import of data
- Migration of `dq-history-collapsed` UI preference

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-27 | 0.1.0 | Caleb Dunn | Initial spec |
