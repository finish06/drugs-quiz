# Session Handoff
**Written:** 2026-03-21T20:00:00Z

## In Progress
- M4: 3/4 features done. Full E2E remaining (cycle 8).

## Completed This Session
- **M3 retro** — scores recorded (collab 7.0, methodology 7.2, swarm 5.5), promoted Alpha → Beta
- **v0.3.0** tagged + released (ghcr.io + personal registry)
- **BFF proxy** (cycle 5) — Hono in bff/, merged PR #4, deployed to staging
- **Batched pre-fetching** (cycle 5) — Promise.allSettled in generators, perf test
- **9 tier-1 bug fixes** (cycle 6) — merged PR #5, tagged v0.3.1, swarm-validated
- **Automated staging deploy** (cycle 7) — FastAPI webhook in deploy-hook/, merged PR #6
  - App-aware with apps.yaml config, HMAC signature verification
  - CI pushes frontend + BFF images, triggers webhook, staging auto-deploys
  - End-to-end tested: merge → CI → webhook → pull → restart → smoke tests → HTTP 200
- **Staging redeployed** from /opt/drugs-quiz/ with BFF proxy + correct CORS
- **Deploy-hook** running at /opt/deploy-hook/ on staging VM (port 9000)
- **GitHub secrets** configured: WEBHOOK_SECRET, STAGING_WEBHOOK_URL
- **.gitignore cleanup** — tsbuildinfo, vite artifacts, playwright-report, test-results, .swarm/
- **Docs updated** — CLAUDE.md (components, hooks, architecture) + 13 sequence diagrams

## Decisions Made
- Beta maturity (promoted from alpha, evidence score 9/10)
- Deploy-hook is app-aware central service (not per-app), config in apps.yaml
- FastAPI + Python for webhook (not Hono)
- HMAC-SHA256 signature verification for deploy security
- CORS fail-closed on BFF (no CORS_ORIGIN = no cross-origin access)
- Staging compose uses registry images (not local builds)
- Deploy-hook needs /opt mounted + Docker config for registry auth
- Health check URLs use host IP (container names not resolvable across networks)
- Swarm false positives should be verified before acting (L-008)

## Blockers
- None

## Next Steps
1. **Cycle 8: Full E2E** — Playwright tests for all quiz flows + error states (completes M4)
2. **Tier 2 bugs** — 9 bugs from swarm audit (race condition, error boundary, etc.)
3. **v0.4.0 tag** after M4 completion
4. **M5: Go Social** — Google OAuth, shareable score cards, instructor links
