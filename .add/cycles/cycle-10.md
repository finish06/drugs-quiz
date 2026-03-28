# Cycle 10 — localStorage Migration + Shareable Scores

**Milestone:** M5 — Go Social: Accounts + Viral Distribution
**Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-03-27
**Duration Budget:** ~10-14 hours
**Mode:** Away (human unavailable)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| localstorage-migrate | SHAPED | VERIFIED | Agent-1 | ~5-6 hours | Migration modal, BFF endpoints (migrate/list/save), dual-source hook, 18 ACs passing |
| shareable-scores | SHAPED | VERIFIED | Agent-1 | ~5-6 hours | Share token column, BFF share/render routes, public page, 21 ACs passing |

## Dependencies & Serialization

```
localstorage-migrate (first)
    ↓ (shareable-scores depends on session CRUD endpoints from migrate)
shareable-scores (second)
```

localStorage migration ships first because:
1. Introduces `POST /api/sessions` and `GET /api/sessions` — shareable-scores needs sessions in the DB to share
2. Rewires `useSessionHistory` to support cloud data source — shareable-scores hooks into auth state from the same pattern
3. The migration modal establishes the authenticated session flow that share extends

## Parallel Strategy

Single-threaded execution. Features advance sequentially.

### File Reservations

**localstorage-migrate:**
- `bff/src/index.ts` (new routes)
- `bff/src/routes/sessions.ts` (new)
- `src/hooks/useSessionHistory.ts` (modify for dual source)
- `src/components/MigrationModal.tsx` (new)
- `src/App.tsx` (mount modal)
- Tests for all above

**shareable-scores:**
- `bff/src/index.ts` (new routes — after migrate is done)
- `bff/src/routes/sessions.ts` (add share endpoint)
- `bff/src/routes/share.ts` (new — public page renderer)
- `bff/drizzle/` (new migration for share_token column)
- `bff/src/db/schema.ts` (add share_token)
- `src/components/QuizResults.tsx` (add Share Link button)
- Tests for all above

### Merge Sequence

1. Both features in a single PR (cohesive M5 social features)

## Validation Criteria

### Per-Item: localstorage-migrate

- [ ] Migration modal appears after first OAuth login when localStorage has sessions
- [ ] "Sync Now" sends sessions to `POST /api/sessions/migrate`
- [ ] BFF validates, deduplicates, and inserts sessions
- [ ] localStorage cleared after successful migration
- [ ] `GET /api/sessions` returns user's sessions (limit 10, ordered by completedAt desc)
- [ ] `POST /api/sessions` saves new sessions for authenticated users
- [ ] `useSessionHistory` reads from API when authenticated, localStorage when not
- [ ] Personal best calculation works with cloud data
- [ ] "Skip" dismisses modal; reappears next login
- [ ] Light/dark mode styling correct

### Per-Item: shareable-scores

- [ ] `share_token` column added to quiz_sessions via migration
- [ ] `POST /api/sessions/:id/share` generates token (idempotent)
- [ ] `GET /s/:token` serves server-rendered HTML with OG meta tags
- [ ] Public page shows score, quiz type, name, date, CTA
- [ ] 404 page for invalid tokens
- [ ] "Share Link" button visible only for authenticated users
- [ ] Existing "Share Results" clipboard button unchanged for all users
- [ ] OG tags correct: title, description, url, site_name
- [ ] Public page responsive + dark mode
- [ ] Re-sharing same session returns same token

### Cycle Success Criteria

- [ ] All ACs from both specs implemented and tested
- [ ] Full test suite passes (no regressions)
- [ ] Coverage remains >= 90%
- [ ] PR created for human review
- [ ] Merge to main
- [ ] Deploy to staging and validate (smoke tests + manual verification)
- [ ] M5 milestone hill chart updated (both features → VERIFIED)
- [ ] Handoff doc updated

## Agent Autonomy & Checkpoints

Beta + Away Mode: Elevated autonomy. Human is unavailable. Agent implements via TDD, creates PR, merges, and deploys to staging.

**Autonomous (proceed without asking):**
- Implement, test, commit to feature branch
- Add DB migrations
- Create PR
- Merge to main (after all tests pass)
- Deploy to staging and run smoke tests
- Rollback staging if smoke tests fail

**Boundaries (queue for human return):**
- DO NOT: Deploy to production (env not configured yet — GCP setup pending)
- DO NOT: Modify existing OAuth flow or auth middleware behavior
- DO NOT: Start features not in this cycle plan
- DO NOT: Make irreversible architecture decisions beyond what specs define

**Blockers noted:**
- Production env not ready (Google Cloud setup pending) — staging is the ceiling
- If staging deploy fails, log the issue and move on
