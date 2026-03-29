# Cycle 11 — Changelog Notification ("What's New")

**Milestone:** Standalone (between M5 and M6)
**Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-03-29
**Duration Budget:** ~8 hours

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| changelog-notification | PLANNED | VERIFIED | Agent-1 | ~8 hours | 23 ACs passing, build-time parser, two-panel UI, notification dot, tests |

## Dependencies & Serialization

```
Single feature — no dependencies or serialization needed.
```

No BFF or DB changes. Entirely frontend + build-time.

## Parallel Strategy

Single-threaded execution. One feature, one agent.

### File Reservations

**changelog-notification:**
- `scripts/parse-changelog.ts` (new)
- `src/generated/changelog.ts` (new, gitignored)
- `src/types/changelog.ts` (new)
- `src/hooks/useChangelog.ts` (new)
- `src/components/WhatsNewPanel.tsx` (new)
- `vite.config.ts` (modify — add plugin)
- `src/App.tsx` (modify — add header icon + mount panel)
- `.gitignore` (modify — add src/generated/)
- `package.json` (modify — update version to 0.5.0)
- Tests for all above

## Validation Criteria

### Per-Item: changelog-notification

- [ ] Vite plugin parses CHANGELOG.md at build time into structured TypeScript module
- [ ] Parser maps Added → NEW, Changed/Performance → IMPROVEMENT, Fixed → BUG FIX
- [ ] Technical entries filtered out (CI, Docker, test infra, coverage)
- [ ] Customer-facing language extracted from bold titles + descriptions
- [ ] App version embedded at build time from package.json
- [ ] Header icon with notification dot when version > last-seen
- [ ] localStorage `dq-changelog-seen` tracks last-seen version
- [ ] Clicking icon opens two-panel modal (version sidebar + entries)
- [ ] Sidebar highlights active version, clicking navigates
- [ ] Category badges render with correct colors (green/blue/orange)
- [ ] Closing panel updates last-seen version, dot disappears
- [ ] Panel works in light and dark mode
- [ ] Mobile responsive — single-column below 640px
- [ ] Close via X button or backdrop click

### Cycle Success Criteria

- [ ] All 23 ACs from spec implemented and tested
- [ ] Full test suite passes (no regressions)
- [ ] Coverage remains >= 78% branches
- [ ] Lint and type check clean
- [ ] Merge to main
- [ ] Deploy to staging and validate
- [ ] Handoff doc updated

## Agent Autonomy & Checkpoints

Beta + Away Mode: Elevated autonomy. Human is unavailable. Agent implements via TDD, creates PR, merges, deploys to staging.

**Autonomous (proceed without asking):**
- Implement, test, commit to feature branch
- Create PR
- Merge to main (after all tests pass)
- Deploy to staging and validate
- Rewrite CHANGELOG.md entries to customer-facing language at parse time

**Boundaries (queue for human return):**
- DO NOT: Deploy to production
- DO NOT: Modify existing component behavior (only add new components + header icon)
- DO NOT: Start features not in this cycle plan

## Notes

- CHANGELOG.md parser transforms developer language → customer-facing at build time
- CHANGELOG.md itself stays as the developer record (no modifications)
- `src/generated/` directory is gitignored — regenerated each build
- This is a standalone cycle between M5 (done) and M6 (not started)
- Also close M5 milestone formally and update config to point to M6
