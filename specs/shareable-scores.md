# Spec: Shareable Score Cards

**Version:** 0.1.0
**Created:** 2026-03-27
**PRD Reference:** docs/prd.md (M5: Go Social)
**Milestone:** M5 — Go Social: Accounts + Viral Distribution
**Status:** Complete

## 1. Overview

Authenticated users can generate a public share link for any completed quiz session. The link serves an HTML page with OG meta tags for rich social previews and a full score breakdown visible to anyone. Each shared session becomes a distribution event — recipients see the score and a CTA to try Rx Quiz themselves.

### User Story

As a pharmacy student, I want to share a link to my quiz results so that my classmates can see my score and be encouraged to try the app.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "Share Link" button appears on QuizResults for authenticated users | Must |
| AC-002 | Clicking "Share Link" calls `POST /api/sessions/{id}/share` to generate a public share token | Must |
| AC-003 | The API returns a short URL path: `/s/{shareToken}` | Must |
| AC-004 | The share token is a URL-safe random string (8–12 characters) | Must |
| AC-005 | After generating, the full URL is copied to clipboard and/or native share sheet is invoked (same behavior as existing share-results) | Must |
| AC-006 | The "Share Link" button shows "Link Copied!" feedback for 2 seconds after success | Must |
| AC-007 | Unauthenticated users do NOT see the "Share Link" button (existing clipboard share remains available to all) | Must |
| AC-008 | Visiting `/s/{shareToken}` renders a public page with the score breakdown | Must |
| AC-009 | The public page shows: quiz type, score percentage, correct/total, date completed, and the sharer's display name | Must |
| AC-010 | The public page includes a CTA button: "Try Rx Quiz" linking to the app homepage | Must |
| AC-011 | The public page includes OG meta tags: `og:title`, `og:description`, `og:url`, `og:site_name` | Must |
| AC-012 | `og:title` follows format: "{Name} scored {percentage}% on {quizTypeLabel}" | Must |
| AC-013 | `og:description` follows format: "{correct}/{total} correct on Rx Quiz — {quizTypeLabel}" | Must |
| AC-014 | The public page is server-rendered by the BFF (not the SPA) so crawlers can read OG tags | Must |
| AC-015 | A share token can only be generated for sessions belonging to the authenticated user | Must |
| AC-016 | Visiting an invalid or expired share token returns a friendly 404 page | Must |
| AC-017 | Share tokens do not expire (permanent links) | Should |
| AC-018 | A session can be shared multiple times; re-sharing returns the existing token rather than creating a new one | Should |
| AC-019 | The public page works in both light and dark mode (respects visitor's OS preference) | Should |
| AC-020 | The public page is responsive (mobile and desktop) | Must |
| AC-021 | The existing clipboard "Share Results" button (text copy) remains available to all users regardless of auth state | Must |

## 3. User Test Cases

### TC-001: Authenticated user generates share link

**Precondition:** User is logged in, quiz completed, results screen visible
**Steps:**
1. Complete a 10-question Name the Class quiz scoring 9/10
2. Click the "Share Link" button
**Expected Result:** URL is copied to clipboard (e.g., `https://drug-quiz.calebdunn.tech/s/a1b2c3d4`). "Link Copied!" feedback appears for 2 seconds.
**Screenshot Checkpoint:** tests/screenshots/shareable-scores/step-01-link-copied.png
**Maps to:** AC-001, AC-002, AC-005, AC-006

### TC-002: Public share page renders correctly

**Precondition:** Share link generated from TC-001
**Steps:**
1. Open the share URL in an incognito/private browser window
**Expected Result:** Page shows: "Caleb scored 90% on Name the Class" heading, "9/10 correct" detail, date completed, and a "Try Rx Quiz" button linking to the homepage.
**Screenshot Checkpoint:** tests/screenshots/shareable-scores/step-02-public-page.png
**Maps to:** AC-008, AC-009, AC-010, AC-020

### TC-003: OG meta tags present for social previews

**Precondition:** Share link exists
**Steps:**
1. Fetch the share URL and inspect HTML `<head>`
**Expected Result:** `og:title` = "Caleb scored 90% on Name the Class", `og:description` = "9/10 correct on Rx Quiz — Name the Class", `og:url` = full share URL, `og:site_name` = "Rx Quiz".
**Maps to:** AC-011, AC-012, AC-013

### TC-004: Unauthenticated user sees clipboard share only

**Precondition:** User is NOT logged in, quiz completed, results screen visible
**Steps:**
1. View results screen
**Expected Result:** "Share Results" clipboard button is visible. "Share Link" button is NOT visible.
**Screenshot Checkpoint:** tests/screenshots/shareable-scores/step-04-unauth.png
**Maps to:** AC-007, AC-021

### TC-005: Invalid share token shows 404

**Precondition:** None
**Steps:**
1. Visit `/s/invalidtoken123`
**Expected Result:** Friendly 404 page: "This quiz result doesn't exist or has been removed." with a link to the homepage.
**Screenshot Checkpoint:** tests/screenshots/shareable-scores/step-05-not-found.png
**Maps to:** AC-016

### TC-006: Re-sharing returns same token

**Precondition:** User already shared a session (TC-001)
**Steps:**
1. Click "Share Link" again for the same session
**Expected Result:** Same URL is copied to clipboard. No new token is created.
**Maps to:** AC-018

### TC-007: Public page dark mode

**Precondition:** Visitor has dark mode OS preference
**Steps:**
1. Visit a share URL
**Expected Result:** Page renders in dark mode with appropriate contrast.
**Screenshot Checkpoint:** tests/screenshots/shareable-scores/step-07-dark-mode.png
**Maps to:** AC-019

## 4. Data Model

### New column: quiz_sessions.share_token

```sql
ALTER TABLE quiz_sessions
  ADD COLUMN share_token VARCHAR(16) UNIQUE;
```

- Nullable — only populated when a user shares
- Indexed for fast lookups on the public page route
- 8–12 character URL-safe random string (nanoid or crypto.randomBytes)

### New column: users.name (already exists)

The public page displays the sharer's name — already available in the `users` table.

## 5. API Contract

### POST /api/sessions/:id/share

Generate (or retrieve existing) share token for a session.

**Auth:** Required (JWT cookie)

**Response (200):**
```json
{
  "shareToken": "a1b2c3d4",
  "shareUrl": "/s/a1b2c3d4"
}
```

**Response (401):** Unauthorized
**Response (403):** Session does not belong to authenticated user
**Response (404):** Session not found

**Behavior:**
- If session already has a `share_token`, return it
- If not, generate a new token, save it, and return it

### GET /s/:shareToken

Serve the public share page (server-rendered HTML).

**Auth:** None (public)

**Response (200):** HTML page with OG meta tags and score breakdown
**Response (404):** Friendly "not found" HTML page

**Note:** This route is served by the BFF directly (not proxied to the SPA). The BFF queries the DB, renders HTML with embedded OG tags, and returns it. This ensures crawlers (Twitter, Reddit, iMessage) see the meta tags without executing JavaScript.

### Data returned by BFF for the share page

```sql
SELECT qs.quiz_type, qs.question_count, qs.correct_count,
       qs.percentage, qs.completed_at, u.name
FROM quiz_sessions qs
JOIN users u ON qs.user_id = u.id
WHERE qs.share_token = $1
```

## 6. UI Behavior

### QuizResults Screen (Authenticated)

- **Existing:** "Share Results" button (clipboard/native share of text) — unchanged, visible to all
- **New:** "Share Link" button appears next to "Share Results" for authenticated users only
- **Icon:** Link icon (distinct from clipboard/share icon)
- **Loading:** Button shows spinner while API generates token
- **Success:** "Link Copied!" feedback for 2 seconds (same pattern as share-results)
- **Error:** "Could not generate link" brief error, dismisses after 3 seconds

### Public Share Page (`/s/{token}`)

**Layout:**
```
┌─────────────────────────────────┐
│         Rx Quiz Logo            │
├─────────────────────────────────┤
│                                 │
│   {Name} scored {%}%            │
│   on {Quiz Type Label}          │
│                                 │
│   ┌───────────────────────┐     │
│   │  {correct} / {total}  │     │
│   │      correct          │     │
│   └───────────────────────┘     │
│                                 │
│   Completed {date}              │
│                                 │
│   ┌───────────────────────┐     │
│   │   Try Rx Quiz  →      │     │
│   └───────────────────────┘     │
│                                 │
├─────────────────────────────────┤
│  A free study tool for          │
│  pharmacy professionals         │
└─────────────────────────────────┘
```

- Centered card layout, max-width ~480px
- Uses project branding (accent color #3b82f6)
- Dark mode via `prefers-color-scheme` media query
- No JavaScript required (static HTML + CSS)
- Responsive: works on mobile and desktop

### 404 Page (`/s/{invalid}`)

```
┌─────────────────────────────────┐
│         Rx Quiz Logo            │
├─────────────────────────────────┤
│                                 │
│   Quiz result not found         │
│                                 │
│   This result doesn't exist     │
│   or has been removed.          │
│                                 │
│   ┌───────────────────────┐     │
│   │   Go to Rx Quiz  →    │     │
│   └───────────────────────┘     │
│                                 │
└─────────────────────────────────┘
```

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| User deletes account | Cascade delete removes sessions + share tokens; shared links return 404 |
| User tries to share another user's session | 403 Forbidden |
| Share token collision (extremely unlikely) | Retry token generation up to 3 times |
| Very long user name | Truncate to 50 chars on public page |
| User has no display name | Show "Someone" instead |
| Concurrent share requests for same session | Both return same token (idempotent — check-then-insert with unique constraint) |
| Session completed before share feature existed (migrated sessions) | Works normally — share_token is just null until shared |
| Bot/crawler visits share page | Gets full HTML with OG tags (no JS needed) |

## 8. Dependencies

- `quiz_sessions` table — needs `share_token` column (new migration)
- `users` table — for sharer's display name
- BFF auth middleware — protects share generation endpoint
- AuthContext — frontend checks auth state to show/hide "Share Link" button
- Existing share-results component — "Share Link" button added alongside existing "Share Results"

### Relationship to share-results spec

This spec **extends** `specs/share-results.md`. The existing clipboard share (text copy) is unaffected and remains available to all users. This spec adds:
- A new "Share Link" button (authenticated only)
- A public page route (`/s/{token}`)
- A DB column for share tokens
- BFF routes for token generation and page rendering

## 9. Out of Scope

- Server-rendered OG images (satori/og) — text-only meta tags for now
- Share analytics (tracking how many people view shared links)
- Expiring share tokens
- Customizable share messages
- Social platform-specific share buttons (Twitter, Reddit)
- Instructor share links / class-level sharing

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-27 | 0.1.0 | Caleb Dunn | Initial spec |
