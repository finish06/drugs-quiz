# Technical Architecture Proposal — drugs-quiz
**Agent:** Technical Architect
**Date:** 2026-03-19

---

## Context

drugs-quiz is a React 19 SPA backed by the drug-gate API. M1 and M2 are shipped. The app
works, tests are solid (95% coverage), and the CI/CD pipeline is operational. The next phase
needs to add user identity (M3), persistence (M4), and eventually mobile delivery (M6) without
accumulating technical debt that makes those features painful to build.

This proposal is written from the perspective of a Staff Engineer who has to maintain this
codebase for 3+ years and ship M3–M6 without rewriting foundational pieces.

---

## 10 Technical Improvements

### 1. API Proxy Hardening — Move Credentials Out of Nginx Config

**The problem:** The current architecture threads the API key through Vite's dev proxy and
relies on Nginx to forward `/api` requests in production — but the nginx.conf has no proxy
configuration at all. This means production must have some other mechanism handling `/api`
routing, or the app is silently broken in prod. The PRD flags this as an open question ("How
should the API key be handled?") and it remains unanswered.

**The fix:** Add a lightweight nginx `proxy_pass` block for `/api` to the nginx.conf, with the
API key injected via a runtime environment variable read at container startup (entrypoint script
that generates the nginx conf from a template). This eliminates build-time secret baking and
makes staging/prod config explicit.

**Why it matters now:** M3 (user accounts) will introduce JWTs and session tokens. If the
proxy layer is murky, auth becomes an integration nightmare.

---

### 2. Structured Error Boundaries with Error Recovery

**The problem:** The current error handling is a single `error` state at the top of
`useQuizSession`. Any unhandled exception in a child component bubbles to a blank screen.
`App.tsx` has one error display block with a "Back" button — no retry, no contextual message,
no differentiation between network errors and generation failures.

**The fix:** Add React Error Boundaries around `QuizConfig`, `MultipleChoice`, `MatchingQuiz`,
and `QuizResults`. Each boundary shows a contextually appropriate fallback and offers smart
recovery (retry the API call, start a new quiz, etc.). Separately, classify errors in
`useQuizSession`: `network-error | generation-failed | api-key-invalid | rate-limited`. Each
class gets appropriate UX treatment and retry logic.

**Why it matters now:** As real users hit the app, the error rate will reveal patterns.
Unclassified errors are unactionable. Classified errors become alertable signals.

---

### 3. Persistent Question Cache with localStorage

**The problem:** The in-memory `requestCache` in `api-client.ts` resets on every page reload.
Every new quiz session re-fetches the EPC class pool (`getDrugClasses` x2 pages) before
generating any questions. On a mobile connection, this cold-start latency is noticeable and
burns API quota.

**The fix:** Add a `localStorage`-backed cache layer with a 1-hour TTL for the EPC class pool
and a 5-minute TTL for per-class drug lists. The in-memory cache remains for within-session
deduplication. The localStorage cache survives reloads and pre-warms the quiz generator.
Cache keys include the API version to invalidate on upgrades.

**Why it matters now:** M6 (PWA/offline) needs a caching story. Building it as a proper
cache abstraction now means the service worker layer in M6 slots in cleanly on top.

---

### 4. Question Pre-fetching and a Question Pool Architecture

**The problem:** The lazy-load strategy (generate 2 questions up front, generate the rest in
the background) is a solid start, but it still generates questions one at a time in a serial
loop. `generateNameTheClassQuestion` iterates over shuffled classes sequentially, trying one
at a time until it finds a usable drug. On cold cache, a single question can require 3–5 API
round-trips. With a 10-question quiz, that's potentially 15–50 API calls at question generation
time.

**The fix:** Refactor `generateSingleQuestion` to accept a `prefetchedDrugs` map (class → drug
list, already fetched) and batch the class-drug lookups up front with `Promise.allSettled`. For
a 10-question quiz, fetch drug candidates for 20 classes concurrently, then pick from the
pre-fetched pool. This cuts question generation from O(n sequential) to O(1 batch + n select).

**Why it matters now:** This is the single biggest perceived performance lever. It's also
required infrastructure before M4's progress tracking — you need to know which drugs a user
was shown, not just whether they answered correctly.

---

### 5. Backend-for-Frontend (BFF) Proxy Service

**The problem:** The API key is currently managed by Vite's dev proxy (dev-only) and presumably
by some other mechanism in production. There's no production proxy config in nginx.conf.
More critically, there's no place to put server-side logic: rate limiting, request validation,
user-scoped API quota, session token verification (needed for M3). All of this would have to
live in a separate service anyway.

**The fix:** Add a minimal BFF — a lightweight Node/Express (or Hono, for edge compatibility)
service that:
- Proxies `/api/*` to drug-gate with the API key in the header
- Handles CORS
- Will accept JWTs in M3 and enforce user-level rate limits
- Provides a `/health` endpoint for smoke tests

Deploy as a second container in docker-compose. CI builds both images. This is the foundation
M3 needs without over-engineering it now.

**Why it matters now:** Without a BFF, M3's OAuth callback and session management have no
server surface to land on. Building it now means M3 writes features, not infrastructure.

---

### 6. End-to-End Test Coverage for the Full Quiz Flow

**The problem:** The Playwright tests exist (based on the CI setup and `tests/e2e/` directory
in CLAUDE.md), but the roadmap-exercise notes "95% test coverage" without distinguishing unit
from E2E. The current E2E tests cover dark mode and matching quiz behavior. There are no E2E
tests that verify the full quiz flow: config → loading → question → answer → next → results.
The `tests/screenshots/` protocol described in the quality gates rules isn't evidenced as
running in CI.

**The fix:** Add E2E test suites for:
- Complete quiz flow for all 3 quiz types (10 questions, happy path)
- Error state: API down → error message displayed
- Session persistence: answer a question, reload, confirm state is reset (no stale state bug)
- Results screen: correct count, percentage, retry flow

Add screenshot capture at each step. Run Playwright in CI on every push to `main` and the
`staging` branch using Playwright's GitHub Actions integration with a mock API server.

**Why it matters now:** M3 introduces auth flows — login, logout, session expiry. You cannot
safely ship auth without E2E coverage of the surrounding state machine.

---

### 7. Automated Staging Deploy on Push to `staging` Branch

**The problem:** The CI pipeline builds and pushes a Docker image on every merge to `main`, but
there is no automated staging deployment step. The staging environment (homelab VM at
192.168.1.145) exists, but the deploy is presumably manual via SSH. This creates drift: the
staging image may be days behind main, making integration testing unreliable.

**The fix:** Add a `deploy-staging` job to ci.yml that:
1. Pulls the freshly pushed `:beta` image on the staging VM via SSH
2. Runs `docker-compose pull && docker-compose up -d`
3. Runs smoke tests (curl the staging URL, verify 200 response)
4. Reports success/failure as a GitHub deployment status

Use `appleboy/ssh-action` GitHub Action. Add `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
secrets.

**Why it matters now:** Once M3 ships, staging becomes the integration test surface for the
BFF + auth stack. Manual deploys at that point are a tax on every feature cycle.

---

### 8. Semantic Release Automation

**The problem:** Releases are currently triggered by manually pushing a `vXX.YY.ZZ` git tag.
There's no enforcement that version numbers follow semantic versioning rules relative to what
changed. The CHANGELOG (noted as advisory in quality gates) is manual. This creates two
failure modes: version numbers drift from meaning (patch bumps for features), and changelogs
go stale.

**The fix:** Adopt `semantic-release` or `release-please` (GitHub-native, simpler). It reads
conventional commit messages (already enforced by the source control rules), computes the next
semver, updates `package.json`, generates a CHANGELOG entry, creates a GitHub release, and
pushes the version tag — all from CI. The existing `release.yml` workflow hooks into the tag
and handles Docker image publishing as-is.

**Why it matters now:** M3 introduces user data. When there's a data schema change, the
version bump communicates breaking vs. non-breaking. Without automation, this discipline
evaporates under feature pressure.

---

### 9. Performance Budget and Bundle Analysis in CI

**The problem:** There's no bundle size tracking. Vite produces an optimized build, but there's
no guardrail preventing a dependency addition that balloons the bundle. For a pharmacy exam
app used on mobile, a 500KB→2MB bundle regression could meaningfully hurt the loading
experience for students on hospital Wi-Fi.

**The fix:** Add `vite-bundle-visualizer` (dev) and `bundlesize` or `size-limit` to CI.
Define budgets:
- Total JS: < 250KB gzipped
- Initial chunk (React + app shell): < 150KB gzipped
- Any single chunk: < 100KB gzipped

CI fails the build if any budget is exceeded. Add a GitHub PR comment showing bundle size
diff when a PR changes `package.json`.

**Why it matters now:** M3 will add an OAuth library (likely `@auth/core` or similar). M4
will add a charting library for progress analytics. Each of these needs a budget to evaluate
against before merging.

---

### 10. TypeScript Strict Mode Audit and `noUncheckedIndexedAccess`

**The problem:** The codebase uses TypeScript but it's unclear whether `strict: true` is
fully enforced with `noUncheckedIndexedAccess`. Array indexing like `examDrugs[0]` in
`quiz-generators.ts` returns `DrugInClass | undefined` under `noUncheckedIndexedAccess` — the
current code treats it as non-null. There are already manual non-null assertions in
`quiz-generators.ts` (`result[j]!`, `result[i]!`) suggesting the compiler isn't catching all
cases.

**The fix:** Enable `noUncheckedIndexedAccess` in `tsconfig.json`. Fix all resulting errors
(primarily array index access patterns in quiz-generators.ts and hooks). Add
`exactOptionalPropertyTypes: true` while at it. This is a one-time 2–4 hour investment that
prevents a class of runtime crashes in the quiz generator logic — crashes that manifest as
silent undefined drug names in quiz options.

**Why it matters now:** Before M3, which adds user sessions and persisted data, the type
safety baseline should be as strict as possible. Undefined user IDs and session tokens are
harder to debug than undefined drug names.

---

## 4-Milestone Roadmap

These four milestones are ordered by dependency and risk. Each one is a prerequisite for the
next. Together they advance the project from Alpha → Beta maturity.

---

### Milestone A: Infrastructure Foundation
**Goal:** Eliminate the production proxy gap, establish automated staging deploys, and create
the technical surface that M3 (user accounts) requires to land cleanly.

**Features:**
1. **BFF Proxy Service** (Improvement #5) — Node/Hono container that proxies drug-gate
   API calls with the key server-side, provides `/health`, and is ready for JWT middleware in
   milestone B.
2. **Automated Staging Deploy** (Improvement #7) — CI job that deploys the `:beta` image
   to the homelab staging VM and runs smoke tests on every push to `main`.
3. **API Proxy Hardening** (Improvement #1) — Fix the nginx.conf gap, inject API key via
   runtime environment, document the production request path explicitly.

**Technical justification:** The drug-gate API key is currently exposed via the dev proxy only.
Production has an undocumented path. Before adding user identity, the API credential
management must be explicit, tested, and server-side. The BFF is the foundation — everything
else (auth, rate limiting, user-scoped features) builds on top of it. Without automated
staging deploys, every iteration of this infrastructure work requires manual intervention.

---

### Milestone B: Quality and Observability Hardening
**Goal:** Before adding user accounts, make the current feature set bulletproof: classified
errors, full E2E coverage, strict types, and a performance budget enforced in CI.

**Features:**
1. **Structured Error Boundaries** (Improvement #2) — Error classification, per-component
   boundaries, retry logic, and meaningful error states for all failure modes.
2. **Full E2E Test Coverage** (Improvement #6) — Complete quiz flow tests for all 3 quiz
   types, error state tests, and screenshot capture in CI using the Playwright GitHub Action.
3. **TypeScript Strict Mode + Bundle Budget** (Improvements #10 + #9) — Enable
   `noUncheckedIndexedAccess`, fix resulting errors, add `size-limit` CI check with budgets
   that account for the M3 OAuth library.

**Technical justification:** Auth flows are state machines. Bugs in auth produce security
vulnerabilities, not just bad UX. You cannot safely ship M3 without full E2E coverage of
the surrounding session management. TypeScript strict mode catches undefined-access bugs before
they become user-reported issues. The bundle budget prevents auth library bloat from silently
degrading mobile performance.

---

### Milestone C: User Accounts (M3 from PRD)
**Goal:** Google OAuth authentication, user profiles, and session management — backed by the
BFF from Milestone A and tested by the E2E suite from Milestone B.

**Features:**
1. **Google OAuth + Session Management** — OAuth flow via BFF, JWT session tokens,
   persistent login state, logout.
2. **User Profile** — Display name from Google, account settings screen, session expiry
   handling.
3. **Semantic Release Automation** (Improvement #8) — Ship v1.0.0 as the first user-facing
   release with a proper changelog and GitHub release notes.

**Technical justification:** This is the PRD's M3 verbatim, but grounded in the BFF
infrastructure from Milestone A. The BFF's JWT middleware slot makes auth a feature addition
rather than an architectural rework. Semantic release at this point signals Beta maturity to
the project and starts generating the changelog that users and instructors will rely on.

---

### Milestone D: Performance and Persistence
**Goal:** Dramatically improve quiz generation speed via batched pre-fetching and localStorage
caching, then add progress tracking (M4 from PRD) on top of the resulting fast, reliable
foundation.

**Features:**
1. **Question Pool Pre-fetching** (Improvement #4) — Batch API calls with `Promise.allSettled`,
   eliminate serial question generation, target < 1s to first question on warm cache.
2. **Persistent Question Cache** (Improvement #3) — localStorage-backed cache for class pool
   and drug lists, aligned with the service worker architecture M6 will need.
3. **Progress Tracking (M4 from PRD)** — Per-user historical accuracy, quiz session history,
   accuracy trends by drug class — enabled by user accounts from Milestone C and the enriched
   question data model from the pre-fetching work.

**Technical justification:** Progress tracking requires two things that don't exist yet: fast
enough question generation to support longer sessions (Improvement #4 unblocks this) and user
identity to associate results with (Milestone C provides this). The localStorage cache is the
stepping stone toward M6's service worker offline support — building it properly now means the
PWA milestone reuses rather than replaces this layer. This milestone completes the Beta
maturity criteria: reliable, fast, data-backed, user-centric.

---

## Summary Table

| Milestone | Primary Driver | PRD Alignment | Duration Appetite | Maturity Advance |
|-----------|---------------|---------------|-------------------|-----------------|
| A: Infrastructure Foundation | Technical debt | Prereq for M3 | 1–2 weeks | Alpha (stable) |
| B: Quality Hardening | Risk reduction | Prereq for M3 | 1 week | Alpha → Beta (gates) |
| C: User Accounts | Product feature | M3 | 2–3 weeks | Beta |
| D: Performance + Persistence | Performance + Product | M4 | 2–3 weeks | Beta (solid) |

**The through-line:** Every milestone builds a stable ledge before climbing to the next. We
do not bolt auth onto an infrastructure gap. We do not ship progress tracking without the
user identity to anchor it. We do not add a PWA layer until the caching abstraction underneath
it is intentional rather than accidental.
