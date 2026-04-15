# Project Learnings — drugs-quiz

> **Tier 3: Project-Specific Knowledge**
> Generated from `.add/learnings.json` — do not edit directly.
> Agents read JSON for filtering; this file is for human review.

## Anti Pattern
- **[high] vi.mock() hoisting: always add top-level mock for all hooks a component imports** (L-012, 2026-04-14)
  When a component imports a hook (e.g. useAchievements), tests fail with cryptic errors unless vi.mock() is declared at the module's top level, even if the hook seems irrelevant to most tests. Nested vi.mock() calls are hoisted and run before tests, overriding the top-level mock for the entire file. Fix: add a permissive default mock at the top of every test file for every hook the subject component imports.

## Technical
- **[medium] achievements-badges TDD cycle: 50+ tests, 6 phases, StrictMode guard pattern** (L-011, 2026-04-14)
  ACs covered: AC-001..018 (AC-004 class-master server eval deferred). RED: 50+ tests. GREEN: 8 implementation files + 2 SQL migrations + 4 route handlers. Key learnings: (1) vi.mock() hoisting breaks tests when nested inside describe blocks — always add top-level mock for any hook the component uses; (2) BFF worktree needs npm install before running — bff/node_modules was empty; (3) cross-package imports (bff→src) fail at runtime — define VALID_BADGE_IDS inline in BFF; (4) useRef guard is essential for React StrictMode double-invoke of achievement check API calls. Spec quality: high — all ACs were testable.

- **[medium] AnswerDetail type extension pattern: extend Answer interface for backward compat** (L-004, 2026-03-20)
  Extended Answer to AnswerDetail (adds question + userAnswer fields) without breaking existing code. QuizSession.answers changed from Answer[] to AnswerDetail[]. Key insight: existing tests needed mock data updated to include new fields, but the runtime code was backward compatible because AnswerDetail extends Answer.

- **[high] v8 coverage OOMs on GitHub Actions free tier — CI coverage must be advisory** (L-006, 2026-03-20)
  v8 coverage provider with jsdom environments consistently OOMs on GitHub Actions free tier runners (7GB RAM). Tried 4GB and 8GB heap, single fork, --no-isolate — all OOM. Solution: split test (blocking) and coverage (advisory, continue-on-error). Coverage validated locally at 94%+. Track for M4 infrastructure hardening.

## Architecture
- **[medium] localStorage-first features ship fast with no backend dependency** (L-002, 2026-03-20)
  Session history and Quick 5 both used localStorage exclusively. Zero backend changes, zero API changes. This validated the PRD's localStorage-first strategy for M3 — features that avoid backend coordination ship significantly faster at alpha maturity.

## Process
- **[medium] Cycle 9 complete: db-schema-orm + google-oauth shipped in single away session** (L-010, 2026-03-23)
  Both features advanced SHAPED→VERIFIED in one session (~3 hours actual). 50 new tests added (212→262). Drizzle ORM schema tests work without a running DB (testing column metadata). Arctic + jose are lightweight OAuth/JWT choices — no native deps, fast install. Auth is additive pattern (AuthProvider defaults to unauthenticated) means zero changes to existing component tests.

- **[medium] Cycle 8 complete: M4 milestone finished — E2E + 4 bug fixes** (L-009, 2026-03-22)
  All 4 M4 features DONE. Cycle 8 delivered 6 Playwright E2E spec files (11+ scenarios) and fixed 4 tier-2 bugs (race condition, error boundary, double-click guard, exit confirmation). 212 unit tests passing, 92.62% coverage. M4 completed in 4 cycles (5-8) over 3 days. Evidence score 9/10 for maturity — 30-day stability window needed before GA promotion.

- **[medium] Cycle 6 complete: 9 tier-1 bugs fixed, swarm-validated on staging** (L-007, 2026-03-21)
  Bug-finder swarm (3 agents: Product, Architecture, Support) identified 32 bugs. Triaged to 9 tier-1. All fixed in single session, merged autonomously, tagged v0.3.1. Re-ran swarm to validate — 8/9 confirmed fixed immediately, 9th (CORS) fixed after staging redeployment from /opt with BFF. Key lesson: staging VM had deployment drift (old nginx config overriding BFF CORS). Automated staging deployment is critical to prevent drift.

- **[high] Multi-agent swarm testing catches bugs humans miss — but verify infrastructure claims** (L-008, 2026-03-21)
  3-agent swarm found 32 bugs across Product/Architecture/Support perspectives. High consensus on top bugs gave confidence. However, swarm made 2 false claims: .env.staging committed to git (actually gitignored) and staging running old code (actually a deployment drift issue, not code). Always cross-reference swarm infrastructure claims against actual state before acting. Note: human does limited smoke validation only — agents must self-verify thoroughly rather than relying on human to catch issues.

- **[medium] Cycle 3 complete: session-history + quick-5 shipped in single session** (L-001, 2026-03-20)
  Both features advanced SPECCED→DONE in one session. 26 new tests added (151→177), 93.4% coverage maintained. Serial execution (session-history first, quick-5 second) worked well since quick-5 depended on SessionRecord type. SessionHistory.tsx component has lower coverage (70.6%) due to rendering branches — worth adding tests in a future cycle.

- **[medium] Cycle 4 complete: answer-review + spaced-repetition shipped, M3 done** (L-003, 2026-03-20)
  Both features advanced SPECCED→DONE in one session. 37 new tests (177→214), 94.1% coverage. Serial execution critical — answer-review introduced AnswerDetail type that spaced-repetition depended on. Spec writing + TDD in same session worked well for alpha maturity. Performance optimization pass (useMemo for weakDrugs, personalBest, MatchingQuiz Sets) kept coverage above threshold.

- **[high] Handoff doc must be updated after every commit and cycle completion** (L-005, 2026-03-20)
  Handoff.md was not updated after cycle 4 work. Human flagged this in retro as a process gap. Auto-handoff triggers in the learning rule must be followed — write handoff after commits, major work items, and before session end. Non-negotiable.

---
*12 entries. Last updated: 2026-04-14. Source: .add/learnings.json*
