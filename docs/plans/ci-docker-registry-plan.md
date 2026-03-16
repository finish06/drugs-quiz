# Implementation Plan: CI Docker Registry Push

**Spec Version:** 0.1.0
**Created:** 2026-03-16
**Team Size:** Solo
**Estimated Duration:** 2-3 hours

## Overview

Extend the existing GitHub Actions CI pipeline to build Docker images and push them to `dockerhub.calebdunn.tech`. Two workflows: a release workflow triggered by version tags, and a beta push added to the existing CI pipeline on main merges. Includes automated beta tag cleanup via the Docker Registry v2 API.

## Approach

Rather than creating entirely separate workflows, the plan splits into two workflow files:

1. **Modify existing `ci.yml`** — add a `docker-beta` job that runs after `quality` passes, only on pushes to `main` (not PRs). This job builds, pushes `beta-{sha}`, and cleans up old betas.
2. **Create new `release.yml`** — triggered only by `v*.*.*` tags (excluding pre-release). Runs quality gates, then builds and pushes `{version}` + `latest`.

This keeps concerns separated: CI handles everyday merges, release handles versioned deployments.

## Acceptance Criteria Analysis

### AC-001: Version tag → versioned + latest push
- **Complexity:** Simple
- **Tasks:** Create `release.yml` with tag trigger, Docker build, multi-tag push
- **Dependencies:** Dockerfile (exists), GitHub secrets (set)

### AC-002: Main merge → beta push
- **Complexity:** Simple
- **Tasks:** Add `docker-beta` job to `ci.yml`, conditional on `push` to `main`
- **Dependencies:** Existing `quality` job passes

### AC-003: Quality gates before push
- **Complexity:** Simple
- **Tasks:** Use `needs: quality` in `ci.yml`, run quality steps in `release.yml`
- **Dependencies:** Existing quality job

### AC-004: Secrets-based auth
- **Complexity:** Simple — secrets already set
- **Tasks:** Reference `${{ secrets.REGISTRY_USERNAME }}` and `${{ secrets.REGISTRY_PASSWORD }}` in docker login
- **Dependencies:** Secrets set (done)

### AC-005: Beta cleanup (keep last 10)
- **Complexity:** Medium — requires Registry v2 API calls
- **Tasks:** Write a cleanup script step that lists tags, filters `beta-*`, sorts, deletes oldest beyond 10
- **Dependencies:** Registry v2 API access

### AC-006: Exclude pre-release tags
- **Complexity:** Simple
- **Tasks:** Tag filter pattern `v[0-9]+.[0-9]+.[0-9]+` (no hyphens)
- **Dependencies:** None

### AC-007: Log pushed tags
- **Complexity:** Simple
- **Tasks:** `echo` statements in workflow steps
- **Dependencies:** None

## Implementation Phases

### Phase 1: Beta Push on Main Merge (~45 min)

| Task ID | Description | Effort | AC | Dependencies |
|---------|-------------|--------|-----|-------------|
| TASK-001 | Add `docker-beta` job to `ci.yml` with `needs: quality` and `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` | 15min | AC-002, AC-003 | Existing ci.yml |
| TASK-002 | Docker login step using secrets | 5min | AC-004 | TASK-001 |
| TASK-003 | Docker build + push with tag `beta-${GITHUB_SHA::7}` | 15min | AC-002, AC-007 | TASK-002 |
| TASK-004 | Beta cleanup step — list tags via Registry v2 API, filter `beta-*`, delete oldest beyond 10 | 30min | AC-005 | TASK-003 |

### Phase 2: Release Push on Version Tag (~30 min)

| Task ID | Description | Effort | AC | Dependencies |
|---------|-------------|--------|-----|-------------|
| TASK-005 | Create `.github/workflows/release.yml` with tag filter `v[0-9]+.[0-9]+.[0-9]+` | 10min | AC-006 | None |
| TASK-006 | Add quality gate steps (lint, typecheck, test, build) | 10min | AC-003 | TASK-005 |
| TASK-007 | Docker login + build + push with `{version}` and `latest` tags | 15min | AC-001, AC-004, AC-007 | TASK-006 |

### Phase 3: Test & Verify (~45 min)

| Task ID | Description | Effort | AC | Dependencies |
|---------|-------------|--------|-----|-------------|
| TASK-008 | Push to main, verify beta image appears in registry | 15min | AC-002 | TASK-004 |
| TASK-009 | Push a version tag, verify versioned + latest images in registry | 15min | AC-001 | TASK-007 |
| TASK-010 | Verify pre-release tag does NOT trigger release | 10min | AC-006 | TASK-007 |
| TASK-011 | Verify cleanup works (check registry tag list) | 10min | AC-005 | TASK-008 |

## Effort Summary

| Phase | Estimated | Tasks |
|-------|-----------|-------|
| Phase 1: Beta push | 65 min | 4 |
| Phase 2: Release push | 35 min | 3 |
| Phase 3: Test & verify | 50 min | 4 |
| **Total** | **~2.5 hours** | **11** |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Registry v2 API doesn't support tag deletion | Low | High | Test the DELETE endpoint manually first; fall back to `skopeo delete` |
| Cleanup script deletes wrong tags | Medium | High | Filter strictly for `beta-` prefix, never touch non-beta tags, log before deleting |
| GitHub Actions Docker buildx caching | Low | Low | Use `docker/build-push-action` with GitHub cache |

## Key Implementation Details

### Beta Cleanup Script Logic

```bash
# 1. List all tags
# 2. Filter for beta-* tags
# 3. Sort by creation date (or alphabetically — SHA-based tags are chronological by push order)
# 4. If count > 10, delete the oldest (count - 10) tags
# 5. To delete: get manifest digest, then DELETE /v2/{name}/manifests/{digest}
```

### Tag Extraction from Git Ref

```yaml
# For version tags: strip 'v' prefix
# refs/tags/v0.1.0 → 0.1.0
VERSION=${GITHUB_REF_NAME#v}

# For beta: first 7 chars of SHA
BETA_TAG=beta-${GITHUB_SHA::7}
```

## Deliverables

### Files Modified
- `.github/workflows/ci.yml` — add `docker-beta` job

### Files Created
- `.github/workflows/release.yml` — version tag release workflow

### No Application Code Changes
This is purely CI/CD infrastructure — no changes to `src/`.

## Next Steps

1. Approve this plan
2. Implement Phase 1 (beta push)
3. Implement Phase 2 (release push)
4. Test with a real push to main + a version tag

## Plan History

| Date | Changes |
|------|---------|
| 2026-03-16 | Initial plan created |
