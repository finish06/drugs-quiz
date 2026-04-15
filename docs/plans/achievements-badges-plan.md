# Implementation Plan: achievements-badges

**Spec:** specs/achievements-badges.md (v0.1.1, Approved)
**UX:** specs/ux/achievements-badges-ux.md (Approved)
**Cycle:** cycle-13 (M7 — Study Experience)
**Team Size:** Solo
**Created:** 2026-04-14
**Estimated Duration:** ~2 working days (~12-14 hours)

## Overview

Build a badge system that awards 5 achievements (First Quiz, Perfect Score, Class Master, Centurion, Streak Seeker) with server-side evaluation for authenticated users, localStorage fallback for guests, sign-in migration, unlock toasts on QuizResults, a dedicated Badges page, and a dashboard widget.

## Objectives

- Ship 5 earnable badges end-to-end (authed + guest paths)
- Server-authoritative unlock logic (anti-tamper, streak correctness)
- Idempotent persistence (safe retries + guest→auth migration)
- A11y-compliant UI (lucide-react icons, ARIA roles on toast)
- Maintain ≥78% branch coverage, no regressions

## AC Coverage Map

All 20 ACs are addressed. AC→Task mapping in task tables below.

## Implementation Phases

### Phase 0: Scaffolding & Dependencies (~1h)

| ID | Description | ACs | Effort | Files |
|---|---|---|---|---|
| T-01 | Add `lucide-react` to `package.json`, install | — | 10m | `package.json`, `package-lock.json` |
| T-02 | Create `src/data/badges.ts` — BadgeDef type + 5-badge catalog | AC-001 | 30m | `src/data/badges.ts`, `src/data/badges.test.ts` |
| T-03 | Add `Trophy/Target/Award/Medal/Flame` icon references to catalog | AC-001 | 10m | `src/data/badges.ts` |

**Exit:** catalog importable with 5 badges, icon names valid lucide exports.

### Phase 1: Backend — Schema, Evaluator, Routes (~4h) — TDD

| ID | Description | ACs | Effort | Files |
|---|---|---|---|---|
| T-10 | Drizzle migration: `achievements` table + unique constraint + FK cascade | AC-008 | 30m | `bff/drizzle/0001_achievements.sql`, `bff/src/db/schema.ts` |
| T-11 | **RED:** Unit tests for evaluator — each badge's unlock logic (incl. 5-Q minimum for Perfect Score) | AC-002..006, AC-015, edge case PS<5 | 1h | `bff/src/services/achievements/evaluator.test.ts` |
| T-12 | **GREEN:** Implement `evaluateBadges(userId, sessionId)` — returns `BadgeId[]` to unlock; queries sessions + uses UTC server timestamps for streak | AC-002..006, AC-015 | 1h | `bff/src/services/achievements/evaluator.ts` |
| T-13 | **RED:** Route tests — `GET /api/achievements`, `POST /check` (happy path + 400/401/404), `POST /migrate` (idempotent + unknown badgeId rejection) | AC-007, AC-008, AC-009, AC-011 | 45m | `bff/src/routes/achievements.test.ts` |
| T-14 | **GREEN:** Implement routes in `bff/src/routes/achievements.ts` + mount in `bff/src/index.ts` | AC-007..009, AC-011 | 45m | `bff/src/routes/achievements.ts`, `bff/src/index.ts` |

**Exit:** all BFF tests pass, migration applies cleanly against local Postgres, 3 endpoints respond correctly with auth middleware.

### Phase 2: Frontend — Hook, Guest Evaluator, Migration (~3h) — TDD

| ID | Description | ACs | Effort | Files |
|---|---|---|---|---|
| T-20 | **RED:** Tests for `useAchievements` hook — authed list fetch, check after session save, guest localStorage read/write, migrate-on-signin flow | AC-009, AC-010, AC-011, AC-016 | 1h | `src/hooks/useAchievements.test.ts` |
| T-21 | **GREEN:** Implement `useAchievements()` — branches by auth state; wraps `api-client` for authed path, pure localStorage for guest | AC-009..011 | 1h | `src/hooks/useAchievements.ts` |
| T-22 | **RED:** Tests for client-side `evaluateGuestBadges` (mirrors server logic for the 5 badges using localStorage session history) | AC-010 | 30m | `src/services/achievements/guest-evaluator.test.ts` |
| T-23 | **GREEN:** Implement `evaluateGuestBadges(sessions)` shared logic | AC-010 | 30m | `src/services/achievements/guest-evaluator.ts` |
| T-24 | Wire sign-in flow — on auth success, call `POST /api/achievements/migrate` with localStorage badges, then clear localStorage on 200 | AC-011 | 30m | `src/contexts/AuthContext.tsx` or `src/hooks/useAuth.ts` |

**Exit:** hook usable from any component, guest + auth paths both work, localStorage migration tested.

### Phase 3: Frontend — UI Components (~3h) — TDD

| ID | Description | ACs | Effort | Files |
|---|---|---|---|---|
| T-30 | **RED:** `BadgeUnlockToast` tests — render, 5s auto-dismiss, stacking with 300ms stagger, Esc dismiss, `role="status"` | AC-012, AC-018 | 45m | `src/components/BadgeUnlockToast.test.tsx` |
| T-31 | **GREEN:** Implement `BadgeUnlockToast` — fixed top-right, lucide icon, aria-live polite | AC-012, AC-018 | 45m | `src/components/BadgeUnlockToast.tsx` |
| T-32 | **RED:** `BadgesPage` tests — loading/empty/populated/error states, earned-first ordering, guest sign-in banner | AC-013, AC-010 | 1h | `src/pages/BadgesPage.test.tsx` |
| T-33 | **GREEN:** Implement `BadgesPage` — 2-col/`lg:`3-col grid, Earned/Locked sections, lucide icons, earn dates | AC-013, AC-018 | 45m | `src/pages/BadgesPage.tsx`, route in `App.tsx`, link in `UserMenu.tsx` |
| T-34 | **RED + GREEN:** `RecentBadgesWidget` — last 3 earned, hidden when 0, link to `/badges` | AC-014 | 30m | `src/components/RecentBadgesWidget.{tsx,test.tsx}`, wire into `ProgressDashboard` |

**Exit:** three components render all documented states, pass unit + RTL tests.

### Phase 4: Integration — QuizResults Wire-Up + Analytics (~1.5h)

| ID | Description | ACs | Effort | Files |
|---|---|---|---|---|
| T-40 | **RED:** `QuizResults` integration test — after session save, `POST /achievements/check` is called with sessionId; returned badges trigger toasts | AC-007, AC-012 | 30m | `src/components/QuizResults.test.tsx` |
| T-41 | **GREEN:** Wire `useAchievements` into `QuizResults`: after session save promise resolves, call check, render toasts | AC-007, AC-012 | 45m | `src/components/QuizResults.tsx` |
| T-42 | Add Umami events: `badge_unlocked` (with badgeId) on unlock, `badges_viewed` on page mount | AC-017 | 15m | `src/services/analytics.ts` or existing analytics hook |

**Exit:** earning a badge in a full quiz flow surfaces a toast and records to DB; events fire.

### Phase 5: E2E + Verification (~1.5h)

| ID | Description | TCs | Effort | Files |
|---|---|---|---|---|
| T-50 | E2E: TC-001 (First Quiz toast + badges page shows earned) | TC-001, TC-006, TC-007 | 30m | `tests/e2e/achievements-badges.spec.ts` |
| T-51 | E2E: TC-002 stacked unlocks (Perfect Score + Centurion, seeded at 99 Qs) | TC-002, TC-008 | 30m | `tests/e2e/achievements-badges.spec.ts` |
| T-52 | E2E: TC-005 guest→auth migration | TC-005 | 30m | `tests/e2e/achievements-badges.spec.ts` |
| T-53 | Manual smoke: TC-003 (Class Master) and TC-004 (Streak) require fixture seeding — run locally, capture screenshots | TC-003, TC-004 | — | screenshots to `tests/screenshots/achievements-badges/` |

**Note:** TC-003 and TC-004 need seeded `quiz_sessions` fixtures; full E2E for those is optional in cycle-13 — unit tests in T-11 cover the unlock logic. Add to follow-up if time permits.

**Exit:** `npx vitest run` + `npx playwright test` green; coverage ≥78% branches; 3 E2E screenshots captured.

## Effort Summary

| Phase | Tasks | Estimated | Notes |
|---|---|---|---|
| 0 — Scaffolding | 3 | ~1h | Dep install, catalog |
| 1 — Backend | 5 | ~4h | Migration + evaluator + 3 routes (TDD) |
| 2 — Frontend data layer | 5 | ~3h | Hook + guest eval + migration (TDD) |
| 3 — UI components | 5 | ~3h | Toast + page + widget (TDD) |
| 4 — Integration | 3 | ~1.5h | QuizResults wire-up + analytics |
| 5 — E2E & verify | 4 | ~1.5h | Playwright specs + screenshots |
| **Total** | **25** | **~14h** | Solo, sequential |

Adding 15% contingency → **~16h / ~2 working days.**

## Dependencies

- ✅ M5 auth + cloud sessions (in prod)
- ✅ existing `quiz_sessions` table (used by evaluator)
- ✅ existing Umami analytics hook (used by T-42)
- ➕ `lucide-react` (added in T-01)
- ✅ Drizzle auto-migration (active in `bff/src/db/migrate.ts`)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Streak logic timezone edge cases | Medium | Medium | Server UTC timestamps only (AC-015); dedicated unit tests with fixture sessions spanning midnight |
| `evaluateBadges` N+1 query on Class Master | Low | Low | Single query with JOIN on drug+class; index on `user_id`; class membership derived from existing session `answers_json` |
| localStorage badge corruption for guests | Low | Low | Zod-validate localStorage shape on read; fall back to empty set on parse fail |
| Race between session save and `/check` | Low | Medium | Client awaits session POST response before calling `/check` (AC-007 enforces sequencing) |
| Bundle size regression from lucide-react | Low | Low | Tree-shake only the 5 icons used; measure with `vite build` before/after |
| Duplicate events from React StrictMode double-invoke | Medium | Low | Track unlock-checked-for-sessionId in a ref to guard against double fire |

## Testing Strategy

- **Unit:** evaluator (server + guest), hook, components — target 100% on evaluator, ≥90% components
- **Integration:** route tests with real Drizzle + test DB, auth middleware mocked
- **E2E:** 3 Playwright specs (TC-001, TC-002, TC-005) + manual fixtures for TC-003/004
- **A11y:** manual keyboard test on toast + badges page; axe-core already in E2E setup
- **Coverage gate:** ≥78% branches (M7 success criterion)

## Deliverables

**Code**
- `src/data/badges.ts` (catalog)
- `bff/src/services/achievements/evaluator.ts`
- `bff/src/routes/achievements.ts`
- `bff/src/db/schema.ts` (+ migration)
- `src/hooks/useAchievements.ts`
- `src/services/achievements/guest-evaluator.ts`
- `src/components/BadgeUnlockToast.tsx`
- `src/pages/BadgesPage.tsx`
- `src/components/RecentBadgesWidget.tsx`

**Tests**
- Unit tests collocated with each source file
- `bff/src/routes/achievements.test.ts`
- `tests/e2e/achievements-badges.spec.ts`
- Screenshots in `tests/screenshots/achievements-badges/`

**Config**
- New migration file in `bff/drizzle/`
- `lucide-react` added to `package.json`

## Sequencing & Execution Order

Solo, single branch (`feature/m7-achievements-badges`):

```
T-01 → T-02 → T-03                    (scaffolding)
  ↓
T-10 → T-11 → T-12 → T-13 → T-14      (backend, strict TDD)
  ↓
T-20 → T-21 → T-22 → T-23 → T-24      (frontend data)
  ↓
T-30/T-31, T-32/T-33, T-34            (UI components, can interleave)
  ↓
T-40 → T-41 → T-42                    (integration)
  ↓
T-50, T-51, T-52, T-53                (E2E + manual)
  ↓
PR → review → staging → production (M7 success criterion update)
```

## Success Metrics

- [ ] All 20 ACs implemented and tested
- [ ] 5 badges earnable end-to-end (auth + guest)
- [ ] 3+ Playwright E2E specs green
- [ ] Coverage ≥78% branches (M7 gate)
- [ ] No regressions in existing test suite
- [ ] Bundle size delta <5KB (lucide tree-shaken)
- [ ] M7 success criterion checked: "At least 5 achievement badges implemented and earnable"
- [ ] Deployed to staging; smoke tested; promoted to production via tag

## Next Steps

1. Review this plan — confirm sequencing and scope
2. Run `/add:tdd-cycle specs/achievements-badges.md` to execute Phase 1 (RED → GREEN → REFACTOR → VERIFY)
3. Continue through phases 2-5 with TDD discipline
4. PR to `main`, await review, deploy to staging, promote to production

## Plan History

- 2026-04-14: Initial plan created
