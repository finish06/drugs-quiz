# Implementation Plan: Google OAuth + User Accounts

**Spec Version:** 0.1.0
**Created:** 2026-03-23
**Team Size:** Solo
**Estimated Duration:** 6 hours

## Overview

Add Google OAuth 2.0 to the Hono BFF with JWT session cookies. Frontend gets an AuthContext with login/logout, a header sign-in button, and user avatar display. Auth is additive — all existing features work without an account.

## Acceptance Criteria Analysis

### AC-001–002: Sign-in button + OAuth redirect
- **Complexity:** Medium
- **Tasks:** TASK-001 (BFF route), TASK-006 (frontend button)
- **Testing:** E2E click → redirect, unit test for route

### AC-003: Callback creates/finds user, issues JWT
- **Complexity:** Complex
- **Tasks:** TASK-002
- **Testing:** Unit test callback logic, mock Google token exchange

### AC-004: JWT payload + 30-day expiry
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test JWT contents and expiry

### AC-005: Redirect after login, header shows user info
- **Complexity:** Medium
- **Tasks:** TASK-002 (redirect), TASK-007 (header UI)
- **Testing:** E2E login flow, component test

### AC-006: GET /api/auth/me
- **Complexity:** Simple
- **Tasks:** TASK-003
- **Testing:** Unit test authenticated + unauthenticated responses

### AC-007–008: Logout clears cookie, header reverts
- **Complexity:** Simple
- **Tasks:** TASK-004 (BFF), TASK-008 (frontend)
- **Testing:** Unit + E2E logout flow

### AC-009: Logout preserves localStorage
- **Complexity:** Simple
- **Tasks:** TASK-008
- **Testing:** E2E verifies localStorage after logout

### AC-010: Unauthenticated users have full access
- **Complexity:** Simple
- **Tasks:** TASK-009
- **Testing:** E2E quiz flow without auth

### AC-011: JWT middleware validates on authenticated requests
- **Complexity:** Medium
- **Tasks:** TASK-005
- **Testing:** Unit test middleware with valid/invalid/expired tokens

### AC-012: Update user profile on returning login
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test user update on callback

### AC-013: Multiple redirect URIs (dev/staging/prod)
- **Complexity:** Simple
- **Tasks:** TASK-001
- **Testing:** Config-driven APP_URL

### AC-014: Env vars for Google credentials
- **Complexity:** Simple
- **Tasks:** TASK-001
- **Testing:** BFF fails with clear error if missing

### AC-015–016: AuthContext + /api/auth/me on load
- **Complexity:** Medium
- **Tasks:** TASK-006
- **Testing:** Component tests for AuthProvider

### AC-017: CSRF state parameter
- **Complexity:** Medium
- **Tasks:** TASK-001, TASK-002
- **Testing:** Unit test state generation + validation

### AC-018: Secure cookie flags
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test Set-Cookie header flags

## Implementation Phases

### Phase 1: BFF Auth Routes (RED → GREEN)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-001 | GET /api/auth/google — generate state, redirect to Google | 30min | db-schema-orm done | AC-002, AC-013, AC-014, AC-017 |
| TASK-002 | GET /api/auth/google/callback — exchange code, create/find user, issue JWT cookie | 1.5h | TASK-001 | AC-003, AC-004, AC-005, AC-012, AC-017, AC-018 |
| TASK-003 | GET /api/auth/me — return user from JWT or 401 | 20min | TASK-002 | AC-006 |
| TASK-004 | POST /api/auth/logout — clear JWT cookie | 15min | — | AC-007 |
| TASK-005 | JWT auth middleware for protected routes | 30min | TASK-002 | AC-011 |

**Write failing tests before each task:**
- Route handler tests with mocked Google OAuth responses
- JWT creation/validation tests
- CSRF state tests
- Middleware tests (valid, invalid, expired, missing token)

### Phase 2: Frontend AuthContext + UI (RED → GREEN)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-006 | Create AuthContext + AuthProvider (calls /api/auth/me on mount) | 45min | TASK-003 | AC-015, AC-016 |
| TASK-007 | Header sign-in button (unauthenticated) / user avatar + dropdown (authenticated) | 45min | TASK-006 | AC-001, AC-005, AC-008 |
| TASK-008 | Logout handler in UI — clears auth state, preserves localStorage | 20min | TASK-004, TASK-006 | AC-007, AC-008, AC-009 |
| TASK-009 | Verify all existing features work without auth (no regressions) | 20min | TASK-006 | AC-010 |

**Write failing tests before each task:**
- AuthProvider render tests (loading, authenticated, unauthenticated states)
- Header component tests (sign-in button vs avatar)
- Logout preserves localStorage test
- Existing quiz flow tests still pass

### Phase 3: Integration + Verify (REFACTOR + VERIFY)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-010 | Wire AuthProvider into App.tsx, update header component | 20min | TASK-007 | All frontend ACs |
| TASK-011 | E2E tests: login flow (mocked OAuth), logout flow, auth persistence | 30min | TASK-010 | TC-001–TC-007 |
| TASK-012 | Run full test suite, lint, types, coverage | 20min | TASK-011 | All |
| TASK-013 | Update .env.example with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, APP_URL | 5min | — | AC-014 |

## Effort Summary

| Phase | Estimated | Tasks |
|-------|-----------|-------|
| Phase 1: BFF Auth Routes | 3h | 5 |
| Phase 2: Frontend Auth UI | 2h | 4 |
| Phase 3: Integration + Verify | 1h | 4 |
| **Total** | **6h** | **13** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| bff/package.json | Modify | Add jose (JWT), arctic or googleapis (OAuth) |
| bff/src/auth/google.ts | Create | OAuth route handlers (redirect, callback) |
| bff/src/auth/jwt.ts | Create | JWT sign/verify utilities |
| bff/src/auth/middleware.ts | Create | Auth middleware for protected routes |
| bff/src/index.ts | Modify | Mount auth routes, apply middleware |
| src/contexts/AuthContext.tsx | Create | AuthProvider + useAuth hook |
| src/components/UserMenu.tsx | Create | Avatar + dropdown (authenticated state) |
| src/components/App.tsx | Modify | Wrap in AuthProvider |
| src/components/Header.tsx | Modify | Add sign-in button / UserMenu |
| .env.example | Modify | Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, APP_URL |
| bff/src/auth/*.test.ts | Create | Auth route + middleware tests |
| src/contexts/AuthContext.test.tsx | Create | AuthProvider tests |
| src/components/UserMenu.test.tsx | Create | UserMenu component tests |
| tests/e2e/auth.spec.ts | Create | E2E auth flow tests |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google OAuth callback edge cases (denied, expired code) | Medium | Medium | Comprehensive error handling in callback, TC-007 covers denial |
| JWT secret rotation in production | Low | High | Document rotation procedure, use env var |
| Cookie not sent cross-origin in dev | Medium | Low | SameSite=Lax works for same-origin; Vite proxy handles dev |
| Existing tests break from AuthProvider wrapping | Low | Medium | AuthProvider defaults to unauthenticated — no behavioral change |

## Testing Strategy

1. **Unit tests (BFF)** — OAuth route handlers (mocked Google), JWT sign/verify, middleware
2. **Unit tests (frontend)** — AuthProvider states, UserMenu rendering, header variants
3. **E2E tests** — Login flow (mocked OAuth redirect), logout, auth persistence across refresh
4. **Regression** — All 212+ existing unit tests pass, existing E2E tests pass

## Dependencies

- `specs/db-schema-orm.md` must be implemented first (users table)
- Google Cloud Console OAuth credentials configured
- Environment variables set in .env

## Next Steps

1. Complete db-schema-orm implementation first
2. Begin TDD cycle: write failing BFF auth route tests
3. Implement OAuth flow
4. Build frontend AuthContext + UI
5. E2E verification
