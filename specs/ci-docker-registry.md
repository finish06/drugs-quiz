# Spec: CI Docker Registry Push

**Version:** 0.1.0
**Created:** 2026-03-16
**PRD Reference:** docs/prd.md §5 Infrastructure
**Status:** Implementing

## 1. Overview

Automate Docker image builds and pushes to a private registry (`dockerhub.calebdunn.tech`) via GitHub Actions. Two triggers: version tags push versioned + latest images, and merges to main push beta images tagged with the commit SHA. Beta images are cleaned up automatically, keeping only the last 10.

### User Story

As the sole developer, I want CI to automatically push tagged images to my private registry so that staging and production can pull versioned containers without manual builds.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Pushing a version tag (e.g., `v0.1.0`) triggers build + push of `dockerhub.calebdunn.tech/drugs-quiz:0.1.0` and `dockerhub.calebdunn.tech/drugs-quiz:latest` | Must |
| AC-002 | Merging a PR to `main` (or direct push) triggers build + push of `dockerhub.calebdunn.tech/drugs-quiz:beta-{7-char-sha}` | Must |
| AC-003 | All quality gates (lint, typecheck, test, build) must pass before any image is pushed to the registry | Must |
| AC-004 | Registry authentication uses GitHub Actions secrets (`REGISTRY_USERNAME`, `REGISTRY_PASSWORD`), never hardcoded | Must |
| AC-005 | Beta image cleanup runs after each beta push, keeping only the 10 most recent `beta-*` tags | Must |
| AC-006 | Version tag push does NOT run on pre-release tags (e.g., `v0.1.0-rc1`) — only stable semver tags | Should |
| AC-007 | CI logs show the full image tag pushed for auditability | Should |

## 3. User Test Cases

### TC-001: Version tag triggers versioned + latest push

**Precondition:** Code on `main` passes all quality gates. GitHub secrets `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` are set.
**Steps:**
1. Create and push a version tag: `git tag v0.1.0 && git push origin v0.1.0`
2. Observe GitHub Actions CI run
3. Check registry for new images
**Expected Result:** Registry contains `drugs-quiz:0.1.0` and `drugs-quiz:latest`, both with the correct image digest.
**Screenshot Checkpoint:** N/A (CI pipeline)
**Maps to:** TBD

### TC-002: Merge to main triggers beta push

**Precondition:** Feature branch with passing CI. GitHub secrets set.
**Steps:**
1. Create a PR from a feature branch to `main`
2. Merge the PR
3. Observe GitHub Actions CI run
4. Check registry for new beta image
**Expected Result:** Registry contains `drugs-quiz:beta-{sha}` where `{sha}` is the first 7 characters of the merge commit SHA.
**Screenshot Checkpoint:** N/A (CI pipeline)
**Maps to:** TBD

### TC-003: Quality gate failure blocks push

**Precondition:** Code with a failing test or lint error.
**Steps:**
1. Push a version tag on code that fails `npx vitest run`
2. Observe GitHub Actions CI run
**Expected Result:** CI fails at the quality gate step. No image is pushed to the registry.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-004: Beta cleanup keeps last 10

**Precondition:** Registry has 12 `beta-*` tags.
**Steps:**
1. Merge another PR to `main` (triggers 13th beta push)
2. Observe cleanup step in CI logs
**Expected Result:** Registry has 10 `beta-*` tags (the 3 oldest are deleted). Non-beta tags (`latest`, `0.1.0`, etc.) are untouched.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-005: Pre-release tag does NOT trigger push

**Precondition:** Code on `main` with GitHub secrets set.
**Steps:**
1. Create and push a pre-release tag: `git tag v0.2.0-rc1 && git push origin v0.2.0-rc1`
2. Observe GitHub Actions
**Expected Result:** No Docker build or push runs. Only stable semver tags trigger the release workflow.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

## 4. Data Model

No application data model — this feature is purely CI/CD infrastructure.

### GitHub Actions Secrets

| Secret | Description |
|--------|-------------|
| `REGISTRY_USERNAME` | Docker registry username (`finish06`) |
| `REGISTRY_PASSWORD` | Docker registry password |

### Image Tag Convention

| Trigger | Tag format | Example |
|---------|------------|---------|
| Version tag `v*.*.*` | `{semver}` + `latest` | `drugs-quiz:0.1.0`, `drugs-quiz:latest` |
| Merge to main | `beta-{7-char-sha}` | `drugs-quiz:beta-a1b2c3d` |

## 5. API Contract

### Docker Registry v2 API (used for beta cleanup)

**List tags:**
```
GET https://dockerhub.calebdunn.tech/v2/drugs-quiz/tags/list
```

**Delete manifest by digest:**
```
DELETE https://dockerhub.calebdunn.tech/v2/drugs-quiz/manifests/{digest}
```

Authentication: Basic auth with `REGISTRY_USERNAME` / `REGISTRY_PASSWORD`.

## 6. UI Behavior

N/A — this is a CI/CD feature with no user-facing UI.

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Tag pushed on branch other than main | Should still trigger if the tag matches `v*.*.*` pattern |
| Multiple tags pushed simultaneously | Each tag triggers its own workflow run |
| Registry is unreachable during push | CI fails with clear error, no partial state |
| Registry is unreachable during cleanup | Cleanup fails gracefully (warning, not error), images still pushed successfully |
| Fewer than 10 beta tags exist | Cleanup is a no-op, no tags deleted |
| Same version tag pushed twice | Docker push overwrites the existing tag (idempotent) |
| Very long commit SHA | Always use first 7 characters for beta tag |

## 8. Dependencies

- Existing CI pipeline (`.github/workflows/ci.yml`) — quality gates run first
- Docker buildx for multi-stage builds
- Private registry at `dockerhub.calebdunn.tech` (Docker Registry v2)
- GitHub Actions secrets: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-16 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
