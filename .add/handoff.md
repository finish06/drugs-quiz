# Session Handoff
**Written:** 2026-05-16 20:15

## In Progress
- M8 Cycle A (fix/m8-cycle-a-hotfix branch). Bug #1 + Bug #4 committed locally; Bug #2 (staging BFF 502) deferred — needs SSH to homelab staging VM.

## Completed This Session
- **M8 milestone + Cycle A/B plan** — docs/milestones/M8-qa-hardening.md, docs/plans/m8-qa-hardening-plan.md, PRD roadmap update
- **QA staging eval** — reports/qa-staging-2026-05-16.md (8 numbered bugs, S0-S3)
- **Bug #1 (M8 dark-mode) fixed** — pre-paint inline script in index.html ensures html.dark is set before React mounts. 4 Playwright tests cover it (chromium + Pixel 7). Root cause: wrapper's first-paint light bg got stuck after useEffect added .dark post-paint; recompute didn't pick up `dark:bg-gray-900`.
- **Bug #4 (M8 staging indexable) fixed** — VITE_ALLOW_INDEXING / VITE_ROBOTS_CONTENT env gate. Dockerfile defaults to deindexed; release.yml opts prod back in AND asserts dist/robots.txt + dist/index.html don't carry Disallow/noindex. 4 vitest tests on renderRobotsTxt/renderSitemapXml.
- **CHANGELOG v0.6.2** drafted, package.json bumped 0.6.1 → 0.6.2
- **eslint config** now ignores .claire/.claude/worktrees/.add/security — sibling-agent workspaces leaking lint errors
- **playwright.config** honors PLAYWRIGHT_DEV_PORT for running alongside other dev servers (resume project owns 5173)
- 414 vitest + 24 Playwright tests green locally

## Decisions Made
- Inline pre-paint script over moving the bg class up to body/html — standard SPA pattern, also eliminates FOUC
- Two env vars for indexing (VITE_ALLOW_INDEXING and VITE_ROBOTS_CONTENT) — Vite's HTML substitution only does value replacement, so the meta tag needs its own content var
- Production grep assertion lives in release.yml job step (not a Vite plugin) to keep blast radius small
- Bug #5 (light-mode contrast) provisionally folded into Bug #1; re-verify in Cycle B
- Deferred TASK-A01/A02 (BFF triage) to Caleb's SSH session

## Blockers
- **Bug #2** — staging BFF 502; needs SSH (`docker compose logs bff --tail=200` on homelab staging VM) before fix can be applied. All other Cycle A work waits on this for the v0.6.2 tag.

## Next Steps
1. Caleb: SSH staging, diagnose + restart BFF (run `docker compose pull bff && docker compose up -d bff` if image is healthy; otherwise check env / DB)
2. Push branch + open PR (autonomy_level=balanced + memory says never push main, so this needs explicit OK before push)
3. Tag v0.6.2 after merge — release.yml deploys to prod
4. Smoke prod dark-mode on iPhone / Android post-deploy (TASK-A22)
5. Begin Cycle B (api-error-ux, contrast, quiztype-fallback, progress-empty-state)

## Notes
- Background dev server: `npm run dev` on port 5174 (started during session)
- /tmp/qa-screenshots/ has before/after screenshots from the fix
