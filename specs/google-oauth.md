# Spec: Google OAuth + User Accounts

**Version:** 0.1.0
**Created:** 2026-03-23
**PRD Reference:** docs/prd.md M5 (Go Social — Accounts + Viral Distribution)
**Status:** Complete

## 1. Overview

Add Google OAuth 2.0 authentication to the app via the Hono BFF. Users click "Sign in with Google" in the header, get redirected to Google, and return with a JWT session cookie. Auth is additive — the entire app works without an account. Authenticated users unlock cloud features (session sync, shareable score cards) in later specs.

### User Story

As a pharmacy student, I want to sign in with my Google account so that my quiz progress can be saved to the cloud and I can share my scores with classmates.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "Sign in with Google" button appears in the app header (top-right corner) when the user is not authenticated | Must |
| AC-002 | Clicking the button redirects the user to Google's OAuth consent screen via `GET /api/auth/google` | Must |
| AC-003 | After Google consent, the BFF callback creates or finds the user in the `users` table and issues a JWT as an httpOnly cookie | Must |
| AC-004 | The JWT contains the user's `id`, `email`, and `name`, and expires after 30 days | Must |
| AC-005 | After successful login, the user is redirected back to the app and the header shows their name and avatar instead of the sign-in button | Must |
| AC-006 | `GET /api/auth/me` returns the current user's profile (`id`, `email`, `name`, `avatar_url`) if authenticated, or 401 if not | Must |
| AC-007 | `POST /api/auth/logout` clears the JWT cookie and returns 200 | Must |
| AC-008 | After logout, the header reverts to showing the "Sign in with Google" button | Must |
| AC-009 | Logging out does NOT clear localStorage (session history, spaced repetition, drug performance are preserved) | Must |
| AC-010 | Unauthenticated users can use all existing features (quiz, history, spaced repetition) with no restrictions | Must |
| AC-011 | The BFF validates the JWT on every authenticated request via middleware — expired or invalid tokens return 401 | Must |
| AC-012 | If a returning Google user's profile info has changed (name, avatar), the `users` record is updated on login | Should |
| AC-013 | The OAuth flow works with redirect URIs for localhost:5173 (dev), staging domain, and production domain | Must |
| AC-014 | `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are read from environment variables — never hardcoded | Must |
| AC-015 | The frontend stores auth state in a React context (`AuthContext`) that provides `user`, `isAuthenticated`, `login()`, `logout()` | Must |
| AC-016 | The frontend calls `GET /api/auth/me` on app load to restore auth state from the JWT cookie | Must |
| AC-017 | CSRF protection is applied to the OAuth flow via a `state` parameter | Must |
| AC-018 | The JWT cookie is set with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/` | Must |

## 3. User Test Cases

### TC-001: First-time Google sign-in

**Precondition:** User has never signed in before, no user record in DB
**Steps:**
1. Open the app
2. Click "Sign in with Google" in the header
3. Google consent screen appears — approve access
4. Redirected back to the app
**Expected Result:** Header shows user's name and Google avatar. A new record exists in the `users` table with email, name, avatar_url, oauth_provider = "google".
**Screenshot Checkpoint:** tests/screenshots/google-oauth/step-01-signed-in-header.png
**Maps to:** TBD

### TC-002: Returning user sign-in

**Precondition:** User has signed in before, user record exists in DB
**Steps:**
1. Open the app (not signed in — cookie expired or cleared)
2. Click "Sign in with Google"
3. Google recognizes the user (may skip consent)
4. Redirected back to the app
**Expected Result:** Header shows user info. No duplicate user record created. `updated_at` is refreshed.
**Screenshot Checkpoint:** tests/screenshots/google-oauth/step-02-returning-user.png
**Maps to:** TBD

### TC-003: Logout flow

**Precondition:** User is signed in
**Steps:**
1. Click user avatar/name in header to open menu
2. Click "Sign out"
3. Observe header and localStorage
**Expected Result:** Header reverts to "Sign in with Google" button. localStorage data (session history, drug performance) is preserved. `GET /api/auth/me` returns 401.
**Screenshot Checkpoint:** tests/screenshots/google-oauth/step-03-signed-out.png
**Maps to:** TBD

### TC-004: Auth state persists across page refresh

**Precondition:** User is signed in
**Steps:**
1. Refresh the page (F5 / Cmd+R)
2. Observe the header
**Expected Result:** User remains signed in. Header shows name and avatar (restored via `GET /api/auth/me` on app load).
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-005: Unauthenticated user has full app access

**Precondition:** User is not signed in
**Steps:**
1. Open the app
2. Start a quiz, complete it, view results
3. Check session history, use Quick 5
**Expected Result:** All features work exactly as before. No sign-in prompts, no restrictions, no degraded experience.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-006: Expired JWT is handled gracefully

**Precondition:** User's JWT has expired (>30 days old)
**Steps:**
1. Open the app
2. App calls `GET /api/auth/me`
**Expected Result:** BFF returns 401. Frontend clears auth state and shows "Sign in with Google" button. No error messages — user simply appears logged out.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-007: OAuth denied by user

**Precondition:** User clicks "Sign in with Google"
**Steps:**
1. On Google consent screen, click "Cancel" or deny access
2. Redirected back to the app
**Expected Result:** User is returned to the app without being signed in. No error page — just the normal unauthenticated state. Optionally a brief toast: "Sign-in cancelled."
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

## 4. Data Model

Uses the `users` table from `specs/db-schema-orm.md`. No additional tables needed.

### JWT Payload

```typescript
interface JwtPayload {
  sub: string;        // user.id (UUID)
  email: string;      // user.email
  name: string;       // user.name
  iat: number;        // issued at (Unix timestamp)
  exp: number;        // expires at (iat + 30 days)
}
```

### AuthContext (Frontend)

```typescript
interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;     // true while checking /api/auth/me on app load
}

interface AuthContextValue extends AuthState {
  login: () => void;      // redirects to /api/auth/google
  logout: () => Promise<void>;  // calls POST /api/auth/logout
}
```

## 5. API Contract

### GET /api/auth/google

**Description:** Initiates Google OAuth flow. Generates a CSRF `state` token, stores it in a short-lived cookie, and redirects to Google's authorization endpoint.

**Response (302):** Redirect to `https://accounts.google.com/o/oauth2/v2/auth` with `client_id`, `redirect_uri`, `scope=openid email profile`, `state`, `response_type=code`

### GET /api/auth/google/callback

**Description:** Handles Google's OAuth callback. Exchanges the authorization code for tokens, fetches user profile, creates/updates user in DB, issues JWT cookie.

**Query Parameters:**
- `code` — authorization code from Google
- `state` — CSRF token (validated against cookie)

**Response (302):** Redirect to app root (`/`) with `Set-Cookie` header containing JWT.

**Error Responses:**
- `400` — Missing `code` or `state` parameter
- `403` — CSRF `state` mismatch
- `502` — Google token exchange failed

### GET /api/auth/me

**Description:** Returns the current authenticated user's profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://lh3.googleusercontent.com/..."
}
```

**Error Responses:**
- `401` — No valid JWT cookie present

### POST /api/auth/logout

**Description:** Clears the JWT cookie.

**Response (200):**
```json
{ "ok": true }
```

## 6. UI Behavior

### States

- **Loading:** On app load, a brief loading state while `GET /api/auth/me` resolves (spinner or skeleton in header auth area)
- **Unauthenticated:** "Sign in with Google" button in header (top-right). Rest of app is fully functional.
- **Authenticated:** User's avatar (circular, 32px) and first name in header. Click opens a dropdown with "Sign out" option.
- **OAuth in progress:** User is on Google's domain — no app UI shown during redirect flow.
- **Error:** If OAuth is denied or fails, user returns to normal unauthenticated state. Optional toast for denial.

### Header Layout

```
┌─────────────────────────────────────────────────────┐
│  💊 Rx Quiz                    [Sign in with Google] │  ← unauthenticated
│  💊 Rx Quiz                    [🟢 Jane ▾]           │  ← authenticated
└─────────────────────────────────────────────────────┘
```

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Header with sign-in button (unauthenticated) | tests/screenshots/google-oauth/step-01-unauthenticated.png |
| 2 | Header with user avatar and name (authenticated) | tests/screenshots/google-oauth/step-02-authenticated.png |
| 3 | User dropdown menu with Sign out | tests/screenshots/google-oauth/step-03-user-menu.png |
| 4 | Header after logout (back to sign-in button) | tests/screenshots/google-oauth/step-04-after-logout.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Google is unreachable during OAuth | BFF returns 502 on callback; frontend shows unauthenticated state |
| User revokes app access in Google settings | Next `GET /api/auth/me` still works (JWT is self-contained); on re-login, Google shows consent again |
| Multiple tabs open during login | All tabs pick up auth state on next `/api/auth/me` call (cookie is shared) |
| JWT cookie deleted manually | `GET /api/auth/me` returns 401; frontend shows sign-in button |
| Same email from different OAuth provider (future) | `oauth_provider` column distinguishes; current spec only supports Google |
| User has no Google profile photo | `avatar_url` is null; header shows first letter initial or default icon |
| Concurrent login attempts | `state` cookie ensures only one valid flow at a time |

## 8. Dependencies

- `specs/db-schema-orm.md` — `users` table must exist (AC-003 creates/finds users)
- Existing BFF in `bff/src/index.ts` — add auth routes and JWT middleware
- Google Cloud Console — OAuth credentials (client ID + secret)
- Frontend `src/App.tsx` — wrap in `AuthProvider` context
- Frontend header component — add sign-in button / user avatar

### Environment Variables (BFF)

| Var | Required | Description |
|-----|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `APP_URL` | Yes | Base URL for redirect URIs (e.g., `http://localhost:5173` or `https://drug-quiz.calebdunn.tech`) |

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-23 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
