# Milestone M8 — QA Hardening (Staging Eval 2026-05-16)

**Goal:** Close every defect uncovered in the 2026-05-16 staging QA evaluation. The two S0 findings (production dark-mode regression, staging BFF outage) interrupt current work; the S1/S2/S3 findings ride along in a hardening cycle.
**Appetite:** 4 days
**Target Maturity:** Beta (no maturity change — this is reliability work for an existing Beta product)
**Status:** NOW
**Started:** TBD
**Completed:** TBD
**Source:** `reports/qa-staging-2026-05-16.md`

## Hill Chart

```
prod-dark-mode-fix     ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S0 production regression
staging-bff-restore    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S0 staging BFF 502
staging-noindex        ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S1 SEO leak on staging
api-error-ux           ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S1 raw JSON.parse error + nginx 502 leak
session-list-contrast  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S1 light-mode session row text invisible
quiztype-fallback      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S2 defensive render for unknown quizType
progress-empty-state   ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  SHAPED — S3 dashboard empty-state copy / badge gating
```

## Feature Details

| Feature | Spec | Position | Cycle | Severity | Notes |
|---------|------|----------|-------|----------|-------|
| prod-dark-mode-fix | TBD | SHAPED | A | S0 | Live regression on rxdrill.com. `dark:bg-*` rules not applying despite `html.dark` set; text colors do apply → white-on-white. Repro: any OS-dark visitor. Suspected interaction between `transition-colors duration-150` and Tailwind v4 `:where(.dark, .dark *)` cascade — isolated div with same classes resolves correctly. Validate on Chrome, Safari, Firefox, and across iOS/Android. |
| staging-bff-restore | TBD | SHAPED | A | S0 | All `/api/*` and `/s/*` return nginx 502 on staging. Check `docker compose ps` and `docker compose logs bff` on staging VM. Likely BFF container crash-looping or last image build broken. Verify deploy-hook smoke step actually fails on this condition and gates deploys. |
| staging-noindex | TBD | SHAPED | A | S1 | Staging `robots.txt` is `Allow: /`, sitemap + canonical + OG all point at staging. Branch `scripts/generate-seo.ts` on env (or new `VITE_ALLOW_INDEXING` flag) so non-prod builds emit `Disallow: /` and `<meta name="robots" content="noindex,nofollow">`. |
| api-error-ux | TBD | SHAPED | B | S1 | Frontend renders raw WebKit `SyntaxError` ("The string did not match the expected pattern") when BFF returns HTML 502, and Sign-in does a hard nav that lands the user on the nginx 502 page. Fix in `src/services/api-client.ts` (check `response.ok` and content-type before JSON.parse, throw typed errors) and `UserMenu` sign-in flow (pre-flight or wrap navigation). Also shorten `auth/me` bootstrap timeout to ~3s — observed 16-18s stalls. |
| session-list-contrast | TBD | SHAPED | B | S1 | `SessionHistory.tsx` row title + per-row score numbers render near-invisible on white in light mode (only relative time + percentage are legible). Audit row classes for missing `text-gray-700`/`text-gray-800` light variant alongside existing dark variant. |
| quiztype-fallback | TBD | SHAPED | B | S2 | Personal-best pills render `: 100%` (empty label + colon) and session rows render blank titles when `quizType` isn't in the label map. Add safe fallback to a humanized version of the raw value, and suppress the leading colon when label is empty. |
| progress-empty-state | TBD | SHAPED | B | S3 | `My Progress` shows "Complete your first quiz" even when localStorage holds completed sessions. Either render guest analytics from localStorage, or update copy to "Sign in to see your dashboard and earn badges" (also resolves the changelog mismatch — v0.6.1 advertised badges that anon users can't unlock). |

## Success Criteria

- [ ] **Bug #1 closed:** Dark mode renders correctly on production and staging across Chrome, Safari, Firefox, iOS Safari, Android Chrome. Verified by toggling theme and reloading at least 3× from a clean cache.
- [ ] **Bug #2 closed:** `curl https://drug-quiz.staging.calebdunn.tech/api/auth/me` returns a non-5xx response (200 or 401). Quiz playthrough on staging completes end-to-end for all 4 modes (Quick 5, Name the Class, Match Drug to Class, Brand/Generic Match).
- [ ] **Bug #2 follow-up:** Deploy-hook smoke step actually fails the deploy when the BFF is unreachable post-deploy. Confirmed by intentionally pointing it at a bad upstream in a one-off test.
- [ ] **Bug #3/#7 closed:** When BFF is unreachable, Start Quiz shows a friendly "Service unavailable. Please try again in a moment." card with a Retry button. Sign-in stays inside the SPA on failure (toast/banner, no nginx page).
- [ ] **Bug #4 closed:** `curl https://drug-quiz.staging.calebdunn.tech/robots.txt` returns `Disallow: /`. HTML head includes `<meta name="robots" content="noindex,nofollow">`. Production unaffected (still indexable).
- [ ] **Bug #5 closed:** In light mode, every label and score number in the session-history list passes WCAG AA contrast against its row background. Verified on at least 4 sample sessions.
- [ ] **Bug #6 closed:** Injecting a session with an unknown `quizType` renders a non-empty label and no orphan colon on the personal-best pill. Existing tests extended to cover this.
- [ ] **Bug #8 closed:** `My Progress` either reflects localStorage data for guests or shows accurate copy that points the user to sign-in. No claim that user has played zero quizzes when localStorage shows otherwise.
- [ ] Vitest + Playwright suites green on the merge commit.
- [ ] Test coverage does not regress (`.add/config.json` threshold).
- [ ] A new Playwright spec covers the BFF-down failure mode (intercept `/api/**` → return 502, assert friendly error card, no `SyntaxError` text on screen).
- [ ] CHANGELOG.md entry under a new patch version (`v0.6.2` or as appropriate) lists each fix with the QA bug reference.

## Dependencies

- None blocking. M7 (Study Experience) work is paused for the duration of Cycle A; resume after A merges.
- Staging VM SSH access (for Bug #2 diagnosis).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dark-mode root cause is a Tailwind v4 / WebKit interaction with no simple fix | Medium | High | Fallback: drop `transition-colors duration-150` from the affected wrappers, or move dark colors to `@layer base` with explicit selectors that outrank `:where()`. Verify a workaround patch reaches prod within 24h even if root-cause investigation takes longer. |
| Staging BFF outage is a deeper infra issue (DB, drug-gate, registry) | Medium | Medium | Cycle A includes triage time; if the fix requires infra work beyond a container restart, scope the larger fix into M4-followups and ship the diagnosis as a written runbook. |
| Adding `noindex` accidentally leaks to production | Low | High | Gate the meta tag and `Disallow` purely on a build-time env var (`VITE_ALLOW_INDEXING`), default to indexing in prod. Explicit Playwright assertion against prod-built `robots.txt`. |
| BFF-down Playwright test is flaky | Medium | Low | Use route-interception in Playwright (not real network failure) to make the failure mode deterministic. |

## Proposed Cycle Plan

### Cycle A — Hotfix (≤ 1 day, in flight today)
Stop the bleeding. Three items, deploy together. Ships as a patch release.
- prod-dark-mode-fix
- staging-bff-restore
- staging-noindex

### Cycle B — Hardening (~2-3 days, follows A)
Address every remaining QA finding. Ships as a second patch release.
- api-error-ux
- session-list-contrast
- quiztype-fallback
- progress-empty-state

## Strategic Rationale

**Production-affecting bugs short-circuit the roadmap.** M7 (Study Experience) was the NOW milestone, but the dark-mode regression on rxdrill.com is rendering most home-screen text invisible to any OS-dark-mode visitor. That overrides any feature work. M8 inserts a hardening pass before M7 resumes.

**Two cycles, not one.** Cycle A is the smallest possible hotfix that buys production back. Bundling the S1/S2/S3 fixes into the same patch would slow the hotfix and increase regression risk. Cycle B follows once A is on prod and quiet.

**No new features.** Resist scope creep. Every item in M8 traces directly to a numbered bug in `reports/qa-staging-2026-05-16.md`. New work goes back into M6 or M7.

**Quiz playthrough validation is part of done.** Bug #2 blocked end-to-end validation of all four quiz modes during QA. Cycle A is not done until those flows actually work on staging again — Bug #2 is the gate, not just one line item.
