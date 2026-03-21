# Project Learnings — drugs-quiz

> **Tier 3: Project-Specific Knowledge**
> Generated from `.add/learnings.json` — do not edit directly.
> Agents read JSON for filtering; this file is for human review.

## Architecture

- 2026-03-15: Chose React + Vite + Capacitor over React Native because the app needs to work well at a URL (web) AND as a native iOS app. Capacitor wraps the same web codebase. Source: /add:init interview.
- 2026-03-15: Chose Tailwind CSS for styling, matching calebdunn.tech brand (accent #3b82f6, system font stack). Source: /add:init interview.
- 2026-03-15: Chose strict quality mode (90% coverage, all gates blocking, E2E required). Source: /add:init interview.
- **[medium] localStorage-first features ship fast with no backend dependency** (L-002, 2026-03-20)
  Session history and Quick 5 both used localStorage exclusively. Zero backend changes, zero API changes. This validated the PRD's localStorage-first strategy for M3 — features that avoid backend coordination ship significantly faster at alpha maturity.

## Technical

- **[medium] AnswerDetail type extension pattern: extend Answer interface for backward compat** (L-004, 2026-03-20)
  Extended Answer to AnswerDetail (adds question + userAnswer fields) without breaking existing code. QuizSession.answers changed from Answer[] to AnswerDetail[]. Key insight: existing tests needed mock data updated to include new fields, but the runtime code was backward compatible because AnswerDetail extends Answer.

## Process

- **[medium] Cycle 3 complete: session-history + quick-5 shipped in single session** (L-001, 2026-03-20)
  Both features advanced SPECCED→DONE in one session. 26 new tests added (151→177), 93.4% coverage maintained. Serial execution (session-history first, quick-5 second) worked well since quick-5 depended on SessionRecord type. SessionHistory.tsx component has lower coverage (70.6%) due to rendering branches — worth adding tests in a future cycle.
- **[medium] Cycle 4 complete: answer-review + spaced-repetition shipped, M3 done** (L-003, 2026-03-20)
  Both features advanced SPECCED→DONE in one session. 37 new tests (177→214), 94.1% coverage. Serial execution critical — answer-review introduced AnswerDetail type that spaced-repetition depended on. Spec writing + TDD in same session worked well for alpha maturity. Performance optimization pass (useMemo for weakDrugs, personalBest, MatchingQuiz Sets) kept coverage above threshold.

---
*4 entries. Last updated: 2026-03-20. Source: .add/learnings.json*
