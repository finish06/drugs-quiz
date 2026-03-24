# Cycle 9 — Database + Google OAuth Foundation

**Milestone:** M5 — Go Social: Accounts + Viral Distribution
**Maturity:** Beta
**Status:** PLANNED
**Started:** TBD
**Completed:** TBD
**Duration Budget:** ~5 days

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| db-schema-orm | SHAPED | DONE | Agent-1 | ~4 hrs | ORM configured, migrations run, users + sessions tables created, unit tests pass |
| google-oauth | SHAPED | DONE | Agent-1 | ~6 hrs | OAuth flow works end-to-end, JWT sessions, login/logout UI, E2E tests pass |

## Dependencies & Serialization

```
db-schema-orm (Agent-1)
    ↓ (google-oauth needs users table to store accounts)
google-oauth (Agent-1)
```

Serial execution required — auth depends on having a database to store users.

## Parallel Strategy

Single-threaded execution. Both features touch the BFF (`bff/src/`) and share the database layer. Serialization avoids merge conflicts.

## Spec Requirements

Before implementation begins, specs must be written for both features:
1. `specs/db-schema-orm.md` — ORM setup, schema design, migration strategy
2. `specs/google-oauth.md` — OAuth flow, JWT sessions, BFF auth routes, frontend login UI

Specs follow existing project patterns (AC-NNN, TC-NNN, TypeScript interfaces).

## Implementation Approach

### db-schema-orm
- Add Drizzle ORM to Hono BFF
- Schema: `users` table (id, email, name, avatar_url, oauth_provider, created_at, updated_at)
- Schema: `sessions` table (id, user_id FK, quiz_type, question_count, correct_count, percentage, completed_at)
- Migration tooling (drizzle-kit)
- Connection config via env vars (DATABASE_URL)
- Unit tests for schema + queries

### google-oauth
- Google OAuth 2.0 flow via BFF routes (`/api/auth/google`, `/api/auth/callback`, `/api/auth/logout`)
- JWT session tokens (httpOnly cookies)
- Frontend: Login button (header), auth state context, protected routes
- Session middleware in BFF for authenticated endpoints
- E2E tests for login/logout flow

## Validation Criteria

### Per-Item Validation
- **db-schema-orm:** Schema migrations run cleanly, CRUD operations tested, connection pooling configured
- **google-oauth:** Full OAuth flow (redirect → callback → JWT → session), logout clears session, unauthorized access returns 401

### Cycle Success Criteria
- [ ] Both features reach DONE position
- [ ] All acceptance criteria from specs verified with tests
- [ ] Existing 212+ unit tests still passing
- [ ] E2E tests added for auth flows
- [ ] Coverage >= 90%
- [ ] Types clean, lint clean
- [ ] PR created for human review

## Agent Autonomy & Checkpoints

Beta maturity, balanced autonomy:
- Agent writes specs, gets human confirmation before implementation
- Agent executes TDD cycles autonomously within spec scope
- PR created for human review before merge
- No deploy to production without human approval

## Notes

- Google Cloud Console OAuth credentials must be configured before auth work begins
- DATABASE_URL env var needed for local dev (docker-compose Postgres service)
- Existing Hono BFF in `bff/src/index.ts` is the extension point
- localStorage migration (cycle 10) and shareable scores (cycle 10) depend on this cycle completing
