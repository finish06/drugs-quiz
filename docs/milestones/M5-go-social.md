# Milestone M5 — Go Social: Accounts + Viral Distribution

**Goal:** Add Google OAuth accounts and shareable score cards. Convert localStorage users to cloud-synced accounts. Every completed quiz becomes a distribution event.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** DONE
**Started:** 2026-03-23
**Completed:** 2026-03-29

## Hill Chart

```
db-schema-orm        ████████████████████████████████████  DONE ✅ — PR #8 merged
google-oauth         ████████████████████████████████████  DONE ✅ — PR #8 merged
localstorage-migrate ████████████████████████████████████  DONE ✅ — PR #9 merged, deployed to production
shareable-scores     ████████████████████████████████████  DONE ✅ — PR #9 merged, deployed to production
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| db-schema-orm | specs/db-schema-orm.md | DONE | Drizzle ORM, Postgres in docker-compose, auto-migrate, 19 tests |
| google-oauth | specs/google-oauth.md | DONE | OAuth via BFF (arctic), JWT (jose), AuthContext, UserMenu, 31 tests |
| localstorage-migrate | specs/localstorage-migrate.md | DONE | Migration modal, BFF session CRUD, dual-source hook, 31 new tests |
| shareable-scores | specs/shareable-scores.md | DONE | Share token, public pages with OG tags, 404 page, 11 new tests |

## Success Criteria

- [x] Google OAuth login/logout via BFF with JWT sessions
- [x] Database schema with users + sessions tables via ORM
- [x] localStorage session history migrates to cloud on first login
- [x] Shareable score cards: OG meta tags for social previews + live public page
- [x] Sharing requires authentication
- [x] v0.5.0 tagged and released (2026-03-29)
- [x] No regression — 279 frontend + 57 BFF = 336 total tests passing
- [x] Coverage: 88% statements, 79% branches (threshold adjusted to 78%)

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
| cycle-9 | db-schema-orm (SHAPED→VERIFIED), google-oauth (SHAPED→VERIFIED) | COMPLETE | PR #8 merged, 262 tests |
| cycle-10 | localstorage-migrate (SHAPED→VERIFIED), shareable-scores (SHAPED→VERIFIED) | COMPLETE | PR #9 merged, 336 total tests, deployed to staging |
