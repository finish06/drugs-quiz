# Milestone M5 — Go Social: Accounts + Viral Distribution

**Goal:** Add Google OAuth accounts and shareable score cards. Convert localStorage users to cloud-synced accounts. Every completed quiz becomes a distribution event.
**Appetite:** 2 weeks
**Target Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-03-23
**Completed:** TBD

## Hill Chart

```
google-oauth         ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — requirements clear, arch TBD
db-schema-orm        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — ORM choice + schema design needed
localstorage-migrate ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — depends on auth + DB
shareable-scores     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — OG image gen + public pages
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| db-schema-orm | specs/db-schema-orm.md | SHAPED | Drizzle ORM in Hono BFF, Postgres (deployer's choice via ORM), users + sessions tables |
| google-oauth | specs/google-oauth.md | SHAPED | OAuth via BFF, JWT sessions, login/logout UI |
| localstorage-migrate | specs/localstorage-migrate.md | SHAPED | "Sync your history to the cloud" on first login, merge localStorage → DB |
| shareable-scores | specs/shareable-scores.md | SHAPED | OG image + live public page per session, share to social, requires auth |

## Success Criteria

- [ ] Google OAuth login/logout via BFF with JWT sessions
- [ ] Database schema with users + sessions tables via ORM
- [ ] localStorage session history migrates to cloud on first login
- [ ] Shareable score cards: OG image for social previews + live public page
- [ ] Sharing requires authentication
- [ ] v0.5.0 tagged and released
- [ ] No regression in existing 212+ unit tests or E2E suite
- [ ] Coverage remains >= 90%

## Dependencies

- M4 complete (BFF proxy, CI pipeline, E2E infrastructure) ✅
- Google Cloud Console project + OAuth credentials configured
- ORM + database setup before auth and migration features

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
| cycle-9 | TBD | PLANNED | First cycle of M5 |
