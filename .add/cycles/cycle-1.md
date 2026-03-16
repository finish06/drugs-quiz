# Cycle 1 — CI Docker Registry Push

**Milestone:** M1 — MVP Quiz
**Maturity:** Alpha
**Status:** IN_PROGRESS
**Started:** 2026-03-16
**Duration Budget:** ~2.5 hours

## Work Items

| Feature | Current Pos | Target Pos | Est. Effort | Validation |
|---------|-------------|-----------|-------------|------------|
| ci-docker-registry | SPECCED | DONE | ~2.5 hours | Beta push on main merge, release push on version tag, beta cleanup working |

## Dependencies & Serialization

Single feature, no dependencies. Serial execution.

## Validation Criteria

### Per-Item Validation
- AC-001: Version tag pushes `{version}` + `latest` to registry
- AC-002: Main merge pushes `beta-{sha}` to registry
- AC-003: Quality gates pass before any push
- AC-004: Auth via GitHub secrets only
- AC-005: Beta cleanup keeps last 10
- AC-006: Pre-release tags excluded
- AC-007: Pushed tags logged in CI output

### Cycle Success Criteria
- [ ] ci.yml updated with docker-beta job
- [ ] release.yml created with version tag workflow
- [ ] Beta push verified on main
- [ ] All tests still passing
- [ ] CI green
