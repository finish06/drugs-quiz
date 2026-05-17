# Implementation Plan: M8 — QA Hardening

**Source milestone:** `docs/milestones/M8-qa-hardening.md`
**Source spec (substitute):** `reports/qa-staging-2026-05-16.md` (8 numbered bugs, S0-S3)
**Created:** 2026-05-16
**Team Size:** Solo (Caleb)
**Maturity:** Beta (strict TDD, full quality gates)
**Estimated Duration:** ~3-4 working days, split into 2 cycles

## Overview

Close every defect from the 2026-05-16 staging QA pass. Two production-affecting S0s (dark-mode regression on rxdrill.com, staging BFF 502) ship together as a hotfix in Cycle A. The remaining S1/S2/S3 hardening ships as Cycle B. No new features — every task traces back to a numbered bug.

## Approach

- **Cycle A is a hotfix patch.** Targets: prod is readable in dark mode, staging BFF up, staging deindexed. Ship as `v0.6.2`.
- **Cycle B is a hardening patch.** Targets: friendly error UX, light-mode contrast, defensive rendering, dashboard copy. Ship as `v0.6.3`.
- Solo developer means everything is sequential per cycle. WIP limit 2 from `.add/config.json` is respected by keeping at most two bugs in flight inside a cycle.
- Strict TDD per maturity: every bug fix lands as `test:` (RED) → `fix:` (GREEN) → optional `refactor:` commits with spec/bug refs.
- Cycle A is the gate: Cycle B does not start until prod and staging have been smoke-validated and the v0.6.2 tag is live.

## Bug-to-Feature Map

| Bug # | Severity | Feature ID | Cycle |
|-------|----------|------------|-------|
| #1 | S0 | prod-dark-mode-fix | A |
| #2 | S0 | staging-bff-restore | A |
| #4 | S1 | staging-noindex | A |
| #3 + #7 | S1 | api-error-ux | B |
| #5 | S1 | session-list-contrast | B (likely auto-resolved by Bug #1) |
| #6 | S2 | quiztype-fallback | B |
| #8 | S3 | progress-empty-state | B |

> **Note on Bug #5:** During QA, "light mode" screenshots actually displayed the broken hybrid state caused by Bug #1 (text used dark variants, backgrounds used light variants). Re-verify Bug #5 against fresh screenshots once Cycle A ships. If contrast is still off after Bug #1 is closed, finish the fix in Cycle B; otherwise mark closed by inheritance and remove from scope.

## Cycle A — Hotfix (≤ 1 day)

### Phase A0: Triage (30-45 min)

| Task ID | Description | Effort | Bug | Dependencies |
|---------|-------------|--------|-----|--------------|
| TASK-A01 | SSH to staging VM; capture `docker compose ps`, `docker compose logs bff --tail=200`, `docker compose logs app --tail=50`, last 5 deploy-hook entries. Paste in retro file. | 15min | #2 | GCP IAP tunnel (see memory `feedback_gcp_ssh`) — *staging VM, not prod* |
| TASK-A02 | Determine BFF failure mode: container exited (and why), image pull failed, env missing, DB unreachable, or drug-gate unreachable. Record cause. | 15min | #2 | TASK-A01 |
| TASK-A03 | Reproduce Bug #1 on a clean Chrome and Firefox profile in addition to the WebKit repro from QA. Capture before-screenshots. Confirm whether the regression follows the `transition-colors duration-150` class. | 15min | #1 | None — can run in parallel with TASK-A01/02 |

### Phase A1: Fix prod-dark-mode-fix (Bug #1) (~1-2 h)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-A04 | **RED** — Add a Vitest test (or Playwright spec) that mounts `<App />` with `localStorage.theme="dark"` and asserts the wrapper's resolved `background-color` matches `--color-gray-900` (oklch lightness < 0.3). Test must fail on current main. | 25min | #1 |
| TASK-A05 | **GREEN** — Apply the smallest fix that makes A04 pass. Try in order until one works on Chrome + Safari + Firefox: (a) move `transition-colors duration-150` to a child element instead of the dark-bg-bearing wrapper; (b) move `bg-gray-50 dark:bg-gray-900` from the wrapper into `body` via `index.html` / a `@layer base` rule; (c) replace `dark:bg-gray-900` with an explicit `@layer base { html.dark body { background: var(--color-gray-900); } }` rule that outranks the `:where()` selector. | 45min | #1 |
| TASK-A06 | Manual cross-browser sweep: Chrome, Firefox, Safari desktop; iOS Safari; Android Chrome (via BrowserStack or a real device). Clear cache, toggle theme 3×, reload 3×. Screenshot each. | 30min | #1 |
| TASK-A07 | **REFACTOR** — If A05 (a) or (b) was chosen, audit every other place that pairs `dark:bg-*` with `transition-colors` (`App.tsx` header, cards in `QuizConfig`, `MultipleChoice`, `MatchingQuiz`, `QuizResults`, `WhatsNewPanel`, `MigrationModal`, `BadgesPage`, `ProgressDashboard`). Apply consistently. | 30min | #1 |
| TASK-A08 | Commit `test: add dark-mode regression test for wrapper bg (M8 #1)` then `fix: apply dark:bg-* reliably across wrappers (M8 #1)`. | 5min | #1 |

### Phase A2: Fix staging-bff-restore (Bug #2) (~30 min, depends on A02 cause)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-A09 | Apply the fix indicated by TASK-A02. Most likely: `docker compose pull bff && docker compose up -d bff`. If image is bad, re-run the release workflow for the last green tag. If env is missing, restore from password manager — never log values. | 15min | #2 |
| TASK-A10 | Verify staging is healthy: `curl -fsS https://drug-quiz.staging.calebdunn.tech/api/auth/me` → 401 (not 502), `…/api/v1/drugs/classes?limit=1` → 200, `…/api/auth/google` → 302 to accounts.google.com. | 5min | #2 |
| TASK-A11 | Investigate why deploy-hook smoke tests didn't gate this: confirm `apps.yaml` health checks (`/api/health`, `/api/v1/drugs/classes`) currently run and would fail on 502. If not, file follow-up task. | 10min | #2 |

### Phase A3: Fix staging-noindex (Bug #4) (~45 min)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-A12 | **RED** — Add a test for `scripts/generate-seo.ts` that asserts: when `VITE_ALLOW_INDEXING=false`, `robots.txt` body contains `Disallow: /` and `sitemap.xml` is omitted (or contains no entries). | 15min | #4 |
| TASK-A13 | **GREEN** — Update `scripts/generate-seo.ts` to branch on a new `VITE_ALLOW_INDEXING` env var (default `false`). Emit `Disallow: /` and an empty/omitted sitemap when false. Update `Dockerfile` to accept the build arg and pass to `npm run generate:seo`. | 15min | #4 |
| TASK-A14 | Add `<meta name="robots" content="noindex,nofollow">` to `index.html` only when `VITE_ALLOW_INDEXING=false`. Use Vite's HTML transform plugin or a `%VITE_ROBOTS%` substitution similar to the existing `%VITE_APP_URL%`. | 15min | #4 |
| TASK-A15 | Set `VITE_ALLOW_INDEXING=true` only in the production GitHub Actions workflow / build job. Staging build picks up the default (`false`). | 10min | #4 |
| TASK-A16 | Production safety test: confirm prod's `robots.txt` still has `Allow: /` and prod HTML has no `noindex` meta. Add a one-line CI assertion that fails the prod build if `Disallow` appears in `dist/robots.txt`. | 10min | #4 |

### Phase A4: Cycle A ship (~30 min)

| Task ID | Description | Effort |
|---------|-------------|--------|
| TASK-A17 | Run `/add:verify` — lint, types, full Vitest, full Playwright (local). All green. | 10min |
| TASK-A18 | Update CHANGELOG.md with v0.6.2 entries referencing bug numbers; bump `package.json`. | 5min |
| TASK-A19 | Open PR `fix/m8-cycle-a-hotfix`, get CI green, merge to main. | 10min |
| TASK-A20 | Tag `v0.6.2`, watch GitHub Actions release workflow build + push images + trigger deploy-hook → staging. | 5min |
| TASK-A21 | Verify staging dark mode + robots.txt + APIs. Then approve production deploy. | 10min |
| TASK-A22 | Post-deploy: load rxdrill.com from a clean OS-dark profile, confirm Bug #1 closed. Visit on iPhone and Android too. Screenshot. | 10min |
| TASK-A23 | Auto-checkpoint to `.add/learnings.json` per `learning.md`: dark-mode root cause, the working fix, the smoke-test gap (if any). | 5min |

**Cycle A done when:** rxdrill.com renders correctly in OS-dark on Chrome/Safari/iOS/Android; staging `/api/auth/me` → 401, `/api/v1/drugs/classes` → 200; staging `robots.txt` says `Disallow: /`; production `robots.txt` says `Allow: /`.

---

## Cycle B — Hardening (~2-3 days)

### Phase B1: api-error-ux (Bugs #3, #7) (~3-4 h)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-B01 | **RED** — In `src/services/api-client.test.ts`, add tests for `request()`: (a) 502 with HTML body → throws `ServiceUnavailableError` with message "Service unavailable. Please try again in a moment."; (b) 500 with empty body → same; (c) 200 with non-JSON content-type → typed error, no `SyntaxError`; (d) network failure → `NetworkError`. | 30min | #3 |
| TASK-B02 | **GREEN** — Update `request()` in `src/services/api-client.ts`: (a) guard `await response.json()` behind `response.ok && content-type.includes('json')`; (b) introduce `ServiceUnavailableError` and `NetworkError` classes; (c) keep `DrugApiError` for 4xx JSON errors; (d) ensure no `SyntaxError` can escape `request()`. | 30min | #3 |
| TASK-B03 | Audit other `fetch` call sites (`AuthContext`, `useSessionHistory`, `useAchievements`, share + sessions endpoints) for the same parse-without-checking-ok pattern. Apply the same guard or route through a shared helper. | 45min | #3 |
| TASK-B04 | Add a 3s timeout (via `AbortController`) to the `/api/auth/me` bootstrap fetch in `AuthContext`. On timeout, treat as unauthenticated and log a single console warning. | 20min | #3 |
| TASK-B05 | **RED** — Playwright spec `tests/e2e/bff-down.spec.ts`: intercept `**/api/v1/**` → 502 HTML body; click Start Quiz; assert "Service unavailable" copy appears, asserts the screen contains a Retry button, asserts the literal "expected pattern" string is *not* on the page. | 30min | #3 |
| TASK-B06 | **GREEN** — In `App.tsx` error state, render the friendlier copy when `error` matches the service-unavailable shape, and add a Retry button next to Back. Retry should call `resetQuiz()` and (when applicable) re-trigger the original request. | 30min | #3 |
| TASK-B07 | **Fix Bug #7** — In `UserMenu` and `ProgressDashboard`, the Sign In click currently does `window.location.href = "/api/auth/google"`. Replace with a guarded helper that fires the redirect inside a `try { await fetch('/api/auth/google', { method: 'HEAD', redirect: 'manual' }); window.location.href = ... } catch { showToast('Sign-in unavailable, try again later') }`. Keep the redirect; just pre-check. | 30min | #7 |
| TASK-B08 | Tests for B07: mock `fetch` to throw → assert toast appears, `window.location.href` not called. Mock `fetch` to return 302 (or opaqueredirect) → assert navigation happens. | 30min | #7 |

### Phase B2: session-list-contrast (Bug #5) (~30-60 min) — only if not auto-resolved by A05

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-B09 | Re-screenshot SessionHistory rows in clean Chrome at light mode after Cycle A is live. If text is readable, mark Bug #5 closed by inheritance and skip B10. | 15min | #5 |
| TASK-B10 | If still failing: audit `SessionHistory.tsx` rows. Confirm `text-gray-900 dark:text-gray-100` resolves correctly; check parent card uses `bg-white` (not `bg-gray-50`) in light. Add an axe-core or `@testing-library/jest-dom` contrast assertion on rendered colors. | 30min | #5 |

### Phase B3: quiztype-fallback (Bug #6) (~45 min)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-B11 | **RED** — `SessionHistory.test.tsx`: inject a session with `quizType: "match-drug-class"` (an obsolete/typo value). Assert (a) the personal-best pill does NOT render the orphan colon (`: 100%` is forbidden); (b) the row title renders a non-empty string. | 20min | #6 |
| TASK-B12 | **GREEN** — In `SessionHistory.tsx`, derive labels via a helper `labelFor(quizType)` that returns `QUIZ_TYPE_LABELS[type] ?? humanize(type)` where `humanize` converts kebab-case to Title Case. When label is falsy, suppress the leading colon on the pill (render `100%` alone, or `Unknown: 100%`). | 15min | #6 |
| TASK-B13 | Run the same defensive pattern wherever `QUIZ_TYPE_LABELS` is used: `App.tsx` (line 27), `QuizResults`, `FlashcardDrill`, `ProgressDashboard`. Add `labelFor` to `src/utils/text.ts`. | 20min | #6 |

### Phase B4: progress-empty-state (Bug #8) (~45 min)

| Task ID | Description | Effort | Bug |
|---------|-------------|--------|-----|
| TASK-B14 | Decide product direction: (a) render localStorage-backed analytics for guests (no badges, no streaks, just session count + per-quiz-type accuracy), OR (b) keep auth-gated dashboard but change copy to "Sign in to see your dashboard and earn badges" with a CTA. Default to (b) unless Caleb pushes back during PR review. | 10min | #8 |
| TASK-B15 | **RED** — `ProgressDashboard.test.tsx`: when unauthenticated + localStorage has 4 sessions, assert the new copy + visible Sign-in CTA are rendered (and the old "Complete your first quiz" copy is gone). | 15min | #8 |
| TASK-B16 | **GREEN** — Update `ProgressDashboard.tsx` empty-state copy and CTA wiring per B14. | 15min | #8 |

### Phase B5: Cycle B ship (~30 min)

| Task ID | Description | Effort |
|---------|-------------|--------|
| TASK-B17 | Run `/add:verify` — lint, types, full Vitest, full Playwright, coverage thresholds. | 10min |
| TASK-B18 | Update CHANGELOG.md (`v0.6.3`) and bump `package.json`. | 5min |
| TASK-B19 | PR `fix/m8-cycle-b-hardening`, CI green, merge. | 10min |
| TASK-B20 | Tag `v0.6.3`, deploy via release workflow → staging → production. | 5min |
| TASK-B21 | Post-deploy verify: BFF-down friendly UX (toggle a network throttle / route block in DevTools), session-history contrast (axe-core spot check), session-history with synthetic typo quizType, dashboard empty state. | 15min |
| TASK-B22 | Auto-checkpoint to `.add/learnings.json`: API client failure-mode patterns, the deploy-hook smoke-gap follow-up. | 5min |

**Cycle B done when:** Every QA bug in the table is checked off in `docs/milestones/M8-qa-hardening.md` and the `v0.6.3` release notes match.

---

## Effort Summary

| Cycle / Phase | Estimated | Bugs | Notes |
|---------------|-----------|------|-------|
| Cycle A — Phase A0 (triage) | 30-45min | #1, #2 | Parallel: A03 alongside A01/A02 |
| Cycle A — Phase A1 (dark mode) | 1-2h | #1 | Single biggest risk in this milestone |
| Cycle A — Phase A2 (BFF restore) | 30min | #2 | Bounded by triage finding |
| Cycle A — Phase A3 (noindex) | 45min | #4 | Mostly script + Dockerfile |
| Cycle A — Phase A4 (ship) | 30min | — | CI + tag + smoke |
| **Cycle A total** | **~4h** | 3 bugs | Same-day hotfix |
| Cycle B — Phase B1 (api error UX) | 3-4h | #3, #7 | Largest block in Cycle B |
| Cycle B — Phase B2 (contrast) | 0.5-1h | #5 | Possibly auto-closed by A1 |
| Cycle B — Phase B3 (quiztype fallback) | 45min | #6 | Tight |
| Cycle B — Phase B4 (empty state) | 45min | #8 | Tight |
| Cycle B — Phase B5 (ship) | 30min | — | CI + tag + smoke |
| **Cycle B total** | **~6-7h** | 4 bugs | Spread across 1-2 days |

**Grand total:** ~10-11 hours of focused work over ~3-4 calendar days.

---

## Dependencies

### External
- GCP IAP SSH access to staging VM (TASK-A01). Use IAP tunnel per memory `feedback_gcp_ssh`.
- BrowserStack (or real iPhone / Android) for cross-browser verification (TASK-A06).

### Internal
- M8 milestone must be `NOW`. M7 is paused.
- No upstream code changes required from M5/M6/M7.

---

## Parallelization Strategy (solo, WIP=2)

| Step | Foreground | Background |
|------|-----------|------------|
| 1 | A01 (SSH + log dump) | A03 (open Chrome/Firefox repros locally in worktree) |
| 2 | A02 (diagnose BFF) | A04 (write failing dark-mode test) |
| 3 | A05 (dark-mode fix attempt) | A09 (restart staging BFF in parallel terminal) |
| 4 | A06 (cross-browser sweep) | A10 (curl staging endpoints) |
| 5 | A07 (refactor) | A12/A13 (noindex test + script) |
| 6 | A14 (HTML meta) | A11 (deploy-hook smoke audit) |
| 7 | A17-A23 (ship) | — single-threaded |
| 8 | B01-B08 (api-error-ux) | — single-threaded (depends on Cycle A merged) |
| 9 | B09-B13 (contrast + fallback) | B14-B16 (empty state) — different files, parallelize via terminal tabs |
| 10 | B17-B22 (ship) | — single-threaded |

WIP limit of 2 honored: never more than two bugs in flight inside a cycle.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Dark-mode root cause is a deep Tailwind v4 / WebKit interaction with no quick fix | Medium | High | A05 has three fallback strategies (a/b/c). If none work, ship an explicit `@layer base` rule that hard-codes `html.dark body { background: oklch(0.21 0.034 264.665); }` — pure CSS override that beats `:where()`. Worst case, drop the transition class. Hotfix window is hours, not days. |
| Staging BFF outage is the symptom of a larger infra problem (Postgres volume corruption, drug-gate down, registry auth) | Medium | Medium | TASK-A02 triage stops short of fix until cause is known. If cause is infra rather than deploy, scope the larger fix into a follow-up and document the runbook. |
| `noindex` accidentally leaks to production | Low | Critical | Default `VITE_ALLOW_INDEXING=false`. **Only** the prod GitHub Actions job sets it true. TASK-A16 adds a CI assertion that fails prod build if `Disallow` appears in `dist/robots.txt`. |
| BFF-down Playwright test (TASK-B05) flakes | Medium | Low | Use Playwright route interception (deterministic) rather than relying on a real broken upstream. Run 3× locally before committing. |
| `auth/me` 3s timeout (TASK-B04) too aggressive for slow networks | Low | Low | Configurable constant `AUTH_BOOTSTRAP_TIMEOUT_MS`; start at 3000; revisit if telemetry shows false-negative sign-ins. |
| TASK-B07 pre-flight HEAD doesn't traverse the OAuth redirect cleanly | Low | Low | Fallback: skip the HEAD pre-flight and rely on the post-redirect error page being the friendlier one. Use `redirect: 'manual'` and treat any `opaqueredirect`/3xx as healthy. |
| Refactor sweep (A07, B03, B13) breaks unrelated components | Low | Medium | Run full Vitest after each refactor commit. Strict TDD policy means failures surface immediately. |

---

## Testing Strategy

### Unit (Vitest)
- `useTheme` already tested; add wrapper-rendering test for Bug #1.
- `api-client` new tests for non-JSON, 502, network failure paths.
- `SessionHistory` test for typo / unknown quiz type.
- `ProgressDashboard` test for guest-with-localStorage empty state.

### Integration / Component
- `App.tsx` error state with new copy + Retry button.
- `UserMenu` sign-in click with mocked `fetch`.

### E2E (Playwright)
- New `tests/e2e/bff-down.spec.ts` — intercept `**/api/**` → 502 HTML; verify no `SyntaxError` copy leaks.
- New `tests/e2e/dark-mode.spec.ts` — assert computed wrapper bg in dark mode is dark across at least two browsers in Playwright config.
- Update existing E2E to ensure they still pass.

### Manual / Out-of-band
- Cross-browser sweep (TASK-A06): real Chrome, Safari, Firefox; iOS Safari; Android Chrome.
- Visual contrast spot-check via axe DevTools or Chrome Lighthouse a11y.
- `curl` assertions on `robots.txt` for both environments post-deploy.

### Coverage
- Must not regress from current 87.16% stmts / 80.59% branches / 89.93% lines (per `.add/handoff.md`).
- Beta gate of 90% is aspirational; this milestone may bump branches closer to that incidentally.

---

## Deliverables

### Code
- `src/services/api-client.ts` — typed error classes, content-type guard.
- `src/contexts/AuthContext.tsx` — bootstrap timeout.
- `src/components/UserMenu.tsx`, `src/components/ProgressDashboard.tsx`, `src/App.tsx` — guarded sign-in helper.
- `src/components/SessionHistory.tsx` (+ `src/utils/text.ts`) — `labelFor` helper.
- `src/components/ProgressDashboard.tsx` — empty-state copy.
- `src/App.tsx` (or wherever the bug lands) — dark-mode wrapper fix.
- `scripts/generate-seo.ts` — `VITE_ALLOW_INDEXING` branch.
- `index.html` — conditional `noindex` meta.
- `Dockerfile`, `.github/workflows/release.yml` — build arg plumbing.

### Tests
- `src/services/api-client.test.ts` — extended.
- `tests/e2e/bff-down.spec.ts` — new.
- `tests/e2e/dark-mode.spec.ts` — new.
- `src/components/SessionHistory.test.tsx` — extended.
- `src/components/ProgressDashboard.test.tsx` — extended.

### Docs
- `CHANGELOG.md` — v0.6.2 + v0.6.3 entries.
- `docs/milestones/M8-qa-hardening.md` — checkboxes filled in.
- `reports/qa-staging-2026-05-16.md` — close-out notes appended.
- `.add/learnings.json` (+ regenerated `.add/learnings.md`) — checkpoints for dark-mode root cause, smoke-test gap.

---

## Success Metrics

- [ ] All 7 features in `M8-qa-hardening.md` reach `VERIFIED`.
- [ ] All 8 success-criteria boxes in the milestone are checked.
- [ ] `v0.6.2` and `v0.6.3` tags live with matching CHANGELOG entries.
- [ ] Prod dark-mode regression closed (verified by Caleb on personal iPhone after Cycle A).
- [ ] Staging quiz playthrough end-to-end for all 4 modes (Quick 5, Name the Class, Match Drug to Class, Brand/Generic Match).
- [ ] No regression in coverage thresholds.
- [ ] No new lint or type errors.
- [ ] Playwright suite green on the merge commits.

---

## Plan History

- 2026-05-16: Initial plan created from milestone M8 and QA report.
