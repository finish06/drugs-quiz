# Process Observations

2026-03-24 14:30 | docs | Full manifest rewrite (was 2026-03-16, missing BFF/auth/DB), updated OAuth diagram for PKCE, CLAUDE.md auth endpoints updated | Low cost — docs were mostly current
2026-03-25 04:50 | docs (readme) | Added env vars table + GCP project to CLAUDE.md; no README.md exists (noted, not created) | Minimal drift — CLAUDE.md was nearly current
2026-04-14 21:38 | [agent-retro] | post-tdd | achievements-badges | vi.mock() hoisting caused all 19 QuizResults tests to fail when a nested vi.mock() was added for useAchievements — fix was to add top-level mock; process gap: test-writer agent should always audit hook imports when wiring new integration into existing component tests.
2026-04-14 21:38 | [agent-retro] | post-tdd | achievements-badges | BFF worktree node_modules was empty (only .vite dir) — bff deps must be installed separately with npm install inside bff/; process gap: worktree setup should include bff npm install step.
