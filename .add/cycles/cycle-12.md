# Cycle 12 — Polish & Ops

**Milestone:** M7 — Study Experience
**Maturity:** Beta
**Status:** IN_PROGRESS
**Started:** 2026-04-11
**Duration Budget:** ~1 day
**Mode:** Away (full autonomy up to production)

## Work Items

| Feature | Current Pos | Target Pos | Assigned | Est. Effort | Validation |
|---------|-------------|-----------|----------|-------------|------------|
| workflow-dispatch | SHAPED | DONE | Agent-1 | ~5 min | `release.yml` accepts manual trigger |
| e2e-prod-smoke | SHAPED | DONE | Agent-1 | ~1 hr | Scheduled GitHub Actions workflow runs daily at 6am UTC, fails on broken smoke tests |
| share-dark-mode-verify | SHAPED | DONE | Agent-1 | ~30 min | Public share page `/s/:token` renders correctly in both light and dark mode |
| keyboard-hints | SHAPED | DONE | Agent-1 | ~1-2 hrs | First-ever quiz shows keyboard shortcut overlay, stores localStorage flag, doesn't reappear |
| quiz-confetti | SHAPED | DONE | Agent-1 | ~1 hr | Canvas confetti animation triggers on 100% quiz completion |

## Dependencies & Serialization

All 5 features are independent — no serialization needed. Single-threaded execution in one feature branch.

## Parallel Strategy

Single branch (`feature/m7-cycle-12-polish`), single PR, single deploy. All 5 features ship together.

### File Reservations (within single branch)
- `.github/workflows/release.yml` (workflow-dispatch)
- `.github/workflows/e2e-prod-smoke.yml` (new)
- `bff/src/routes/share.ts` (share-dark-mode-verify — verify only, fix if needed)
- `src/components/KeyboardHintsOverlay.tsx` (new)
- `src/components/MultipleChoice.tsx`, `src/components/MatchingQuiz.tsx` (mount overlay)
- `src/hooks/useKeyboardHintsSeen.ts` (new)
- `src/components/QuizResults.tsx` (confetti trigger)
- New dependency: `canvas-confetti` (tiny, ~1.7kb)

## Validation Criteria

### Per-Item

- **workflow-dispatch:** `release.yml` has `workflow_dispatch:` trigger with `version` input. Can be triggered from GitHub Actions UI.
- **e2e-prod-smoke:** New workflow `e2e-prod-smoke.yml` runs on `schedule: cron '0 6 * * *'`. Tests home page loads, `/api/health` returns 200, `/health` returns JSON.
- **share-dark-mode-verify:** Visual confirmation that `/s/:token` pages render dark mode. Fix any CSS gaps.
- **keyboard-hints:** New `KeyboardHintsOverlay` component. First-time visitor to a question sees overlay. Dismiss stores `dq-kbd-hints-seen` localStorage. Tests for hook + component.
- **quiz-confetti:** `QuizResults` triggers confetti when `percentage === 100`. Canvas confetti launched. Respects `prefers-reduced-motion`.

### Cycle Success Criteria

- [ ] All 5 features implemented and tested
- [ ] Full test suite passes (no regressions)
- [ ] Lint + type check clean
- [ ] Single PR created, reviewed (self), merged after CI
- [ ] Patch version bump (v0.5.13)
- [ ] Production deploy via version tag
- [ ] Production smoke tests pass
- [ ] Milestone hill chart updated
- [ ] Handoff doc updated

## Agent Autonomy & Checkpoints

Beta + Away Mode: Elevated autonomy. Human is unavailable. Agent implements via TDD, creates PR, merges after CI passes (no `--admin`), tags version, deploys to production.

**Autonomous:**
- Implement all 5 features
- Run tests locally
- Commit to feature branch
- Open PR, wait for CI
- Merge (normal merge, no admin bypass)
- Bump version + tag
- Deploy to production via release pipeline
- Approve production deploy environment gate
- Verify production after deploy

**Boundaries:**
- DO NOT push directly to main
- DO NOT use `--admin` flag to bypass CI
- DO NOT modify OAuth or session handling
- DO NOT introduce features outside this cycle plan

## Notes

- `canvas-confetti` is the smallest confetti library (~1.7kb gzipped, no deps)
- `prefers-reduced-motion` respected for accessibility
- E2E smoke tests use lightweight curl-based approach (not full Playwright) to minimize CI cost
- Share dark mode already has `@media (prefers-color-scheme: dark)` in the HTML — verify it works end-to-end, fix if broken
