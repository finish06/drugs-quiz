# Session Handoff
**Written:** 2026-03-29

## In Progress
- Nothing actively in progress. Cycle 11 complete and deployed to staging.

## Completed This Session
- **Spec written** — `specs/changelog-notification.md` (23 ACs, 8 TCs)
- **Plan written** — `docs/plans/changelog-notification-plan.md`
- **Cycle 11 executed** — changelog notification feature fully implemented
- **Build-time parser** — `scripts/parse-changelog.ts` parses CHANGELOG.md, filters technical entries, outputs typed module
- **Vite plugin** — generates `src/generated/changelog.ts` at build time
- **useChangelog hook** — version comparison, localStorage tracking, `hasUnseen` flag
- **WhatsNewPanel** — two-panel modal (sidebar + categorized entries), responsive mobile layout
- **Header icon** — sparkle icon with blue notification dot for unseen updates
- **PR #10** — https://github.com/finish06/drugs-quiz/pull/10 (merged)
- **CI fixes** — added changelog generation step, tsx dependency, tsconfig.node.json include
- **Deployed to staging** — verified changelog data in production bundle
- **v0.5.0 tagged** — M5 milestone formally complete
- **README, PRD, CHANGELOG updated** — all docs current for v0.5.0

## Decisions Made
- Changelog parsed at build time from CHANGELOG.md (not from API)
- Technical entries filtered via regex patterns (CI, Docker, ORM, etc.)
- CHANGELOG.md stays developer-facing; parser transforms to customer language
- Version comparison via semver for notification dot
- Two-panel layout with CSS-based responsive collapse (no JS media queries)

## Blockers
- Production env still not configured (Google Cloud OAuth)

## Next Steps
1. **Manual QA** — test What's New panel on staging (dot, sidebar, badges, mobile)
2. **Plan M6** — specs needed for pwa-offline, exam-countdown, school-leaderboards
3. **Configure production** — Google Cloud OAuth credentials + env vars
4. **Close M5 formally** — update config to point current_milestone to M6
