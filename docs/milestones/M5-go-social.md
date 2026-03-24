# Milestone M5 — Go Social: Accounts + Viral Distribution

**Goal:** Add Google OAuth accounts and shareable score cards. Convert localStorage users to cloud-synced accounts. Every completed quiz becomes a distribution event.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-03-23
**Completed:** TBD

## Hill Chart

```
db-schema-orm        ████████████████████████████████████  VERIFIED — PR #8, 19 schema tests, awaiting merge
google-oauth         ████████████████████████████████████  VERIFIED — PR #8, 31 auth tests (BFF+frontend), awaiting merge
localstorage-migrate ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — depends on auth + DB
shareable-scores     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — OG image gen + public pages
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| db-schema-orm | specs/db-schema-orm.md | VERIFIED | Drizzle ORM, Postgres in docker-compose, auto-migrate, 19 tests |
| google-oauth | specs/google-oauth.md | VERIFIED | OAuth via BFF (arctic), JWT (jose), AuthContext, UserMenu, 31 tests |
| localstorage-migrate | specs/localstorage-migrate.md | SHAPED | "Sync your history to the cloud" on first login |
| shareable-scores | specs/shareable-scores.md | SHAPED | OG image + live public page per session |

## Success Criteria

- [x] Google OAuth login/logout via BFF with JWT sessions
- [x] Database schema with users + sessions tables via ORM
- [ ] localStorage session history migrates to cloud on first login
- [ ] Shareable score cards: OG image for social previews + live public page
- [ ] Sharing requires authentication
- [ ] v0.5.0 tagged and released
- [x] No regression in existing 212+ unit tests or E2E suite
- [ ] Coverage remains >= 90%

## Dependencies

- M4 complete (BFF proxy, CI pipeline, E2E infrastructure) ✅
- Google Cloud Console project + OAuth credentials configured
- ORM + database setup before auth and migration features ✅

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OG image generation complexity | Medium | Medium | Start with HTML-to-image (satori/og), fall back to template if slow |
| OAuth state machine edge cases | Medium | High | Comprehensive E2E tests, session expiry handling |
| localStorage migration data loss | Low | High | Dry-run preview before merge, keep localStorage as backup |
| Database hosting cost | Low | Low | SQLite fallback via ORM abstraction if Postgres is overkill |

## Scope Changes from PRD

- **Removed:** Instructor share links — punted to backlog
- **Removed:** v1.0.0 tag — deferred to app store availability (M6+); tagging v0.5.0 instead

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
| cycle-9 | db-schema-orm (SHAPED→VERIFIED), google-oauth (SHAPED→VERIFIED) | COMPLETE | PR #8 created, 262 tests passing, awaiting human review |
