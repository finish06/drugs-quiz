# Implementation Plan: Changelog Notification ("What's New")

**Spec:** specs/changelog-notification.md v0.1.0
**Created:** 2026-03-29
**Team Size:** Solo
**Estimated Duration:** ~8 hours (1 day)

## Overview

Build a customer-facing "What's New" feature: a Vite build plugin parses CHANGELOG.md into structured data, a header icon with notification dot signals unseen updates, and a two-panel modal shows categorized changelog entries (NEW, IMPROVEMENT, BUG FIX).

## Objectives

- Parse CHANGELOG.md at build time into typed, customer-facing changelog data
- Show a notification dot when the app version is newer than the user's last-seen version
- Render a two-panel changelog viewer (version sidebar + categorized entries)
- Responsive: collapses to single-column on mobile

## Acceptance Criteria Analysis

### AC-014, AC-015, AC-016, AC-017, AC-018, AC-023: Build-Time Parser
- **Complexity:** Medium
- **Effort:** 2.5 hours
- **Tasks:** Vite plugin, CHANGELOG.md parser, customer-facing text extraction, technical entry filtering, version embedding
- **Risks:** CHANGELOG.md format inconsistencies

### AC-001, AC-002, AC-003, AC-012, AC-013: Header Icon + Notification Dot
- **Complexity:** Simple
- **Effort:** 1 hour
- **Tasks:** Icon SVG, notification dot, localStorage version tracking, version comparison logic
- **Dependencies:** Build-time version embedding (AC-018)

### AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-019, AC-021: What's New Panel
- **Complexity:** Medium
- **Effort:** 2.5 hours
- **Tasks:** Modal component, two-panel layout, version sidebar with active state, category badges, entry rendering, dark mode, close behavior
- **Dependencies:** Build-time changelog data (AC-014)

### AC-020, AC-022: Mobile Responsive
- **Complexity:** Simple
- **Effort:** 0.5 hours
- **Tasks:** Tailwind responsive breakpoints, single-column collapse
- **Dependencies:** Panel component (AC-004)

## Implementation Phases

### Phase 1: Build-Time Parser (2.5h)

| Task ID | Description | Effort | Dependencies | ACs |
|---------|-------------|--------|--------------|-----|
| TASK-001 | Write CHANGELOG.md parser script (`scripts/parse-changelog.ts`) | 1.5h | — | AC-014, AC-016, AC-023 |
| TASK-002 | Create Vite plugin to run parser at build time, output `src/generated/changelog.ts` | 0.5h | TASK-001 | AC-015, AC-018 |
| TASK-003 | Add technical entry filtering (skip CI/CD, test infra, internal tooling entries) | 0.5h | TASK-001 | AC-017 |

**Details:**
- Parser reads `CHANGELOG.md`, extracts version blocks via regex (`## [x.y.z] - date`)
- Maps `### Added` → "new", `### Changed`/`### Performance` → "improvement", `### Fixed` → "fix"
- Parses `**bold title**` + remaining text as title/description
- Filters entries that mention: test, CI, Docker, coverage, lint, internal, infra
- Outputs typed TypeScript module with `changelog` array + `appVersion` string
- Vite plugin hooks into `buildStart` to generate the file before bundling
- `package.json` version field supplies `appVersion`

**Deliverables:**
- `scripts/parse-changelog.ts`
- `vite-plugin-changelog.ts` (or inline in vite.config.ts)
- `src/generated/changelog.ts` (gitignored, regenerated each build)
- `src/types/changelog.ts` (type definitions)

### Phase 2: Header Icon + Version Hook (1h)

| Task ID | Description | Effort | Dependencies | ACs |
|---------|-------------|--------|--------------|-----|
| TASK-004 | Create `useChangelog` hook (version comparison, localStorage, hasUnseen) | 0.5h | TASK-002 | AC-002, AC-003, AC-012, AC-013 |
| TASK-005 | Add What's New icon + notification dot to App.tsx header | 0.5h | TASK-004 | AC-001 |

**Details:**
- `useChangelog` hook reads `appVersion` from generated module, compares to `dq-changelog-seen` in localStorage
- Exposes: `hasUnseen`, `markSeen()`, `changelog` data
- Header icon: sparkle or megaphone SVG, consistent with existing icon style (h-5 w-5, stroke)
- Notification dot: absolute-positioned `h-2 w-2 rounded-full bg-blue-500` on the icon

### Phase 3: What's New Panel Component (2.5h)

| Task ID | Description | Effort | Dependencies | ACs |
|---------|-------------|--------|--------------|-----|
| TASK-006 | Build `WhatsNewPanel` component — modal overlay, two-panel layout | 1.5h | TASK-004 | AC-004, AC-005, AC-011, AC-019, AC-021 |
| TASK-007 | Build version sidebar with active state and click navigation | 0.5h | TASK-006 | AC-006, AC-007, AC-008 |
| TASK-008 | Build entry list with category badges (NEW/IMPROVEMENT/BUG FIX) | 0.5h | TASK-006 | AC-009, AC-010 |

**Details:**
- Follows MigrationModal pattern: `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm`
- Inner container: `max-w-3xl` with two-column grid (`grid-cols-[200px_1fr]`)
- Sidebar: scrollable list of versions, active version highlighted with `border-l-2 border-brand text-brand`
- Content pane: scrollable, shows entries for selected version
- Category badges: inline pill with colored bg/text per spec
- Close: X button + backdrop click
- `onClose` calls `markSeen()` from useChangelog hook

### Phase 4: Mobile Responsive (0.5h)

| Task ID | Description | Effort | Dependencies | ACs |
|---------|-------------|--------|--------------|-----|
| TASK-009 | Add responsive breakpoints — single-column on mobile | 0.5h | TASK-006, TASK-007 | AC-020, AC-022 |

**Details:**
- Below `sm:` (640px): hide sidebar, render all versions in single column with version headers as separators
- Above `sm:`: show two-panel layout
- Use Tailwind `hidden sm:block` / `sm:hidden` pattern

### Phase 5: Testing (1.5h)

| Task ID | Description | Effort | Dependencies | ACs |
|---------|-------------|--------|--------------|-----|
| TASK-010 | Unit tests for CHANGELOG.md parser | 0.5h | TASK-001 | AC-014, AC-016, AC-017 |
| TASK-011 | Unit tests for `useChangelog` hook (version comparison, localStorage) | 0.5h | TASK-004 | AC-002, AC-003, AC-012, AC-013 |
| TASK-012 | Component tests for `WhatsNewPanel` (render, navigation, badges, close) | 0.5h | TASK-006 | AC-004–AC-011, AC-019, AC-021 |

**Testing strategy:**
- Parser tests: feed sample CHANGELOG.md content, assert structured output
- Hook tests: mock localStorage, assert `hasUnseen` logic and `markSeen` behavior
- Component tests: render with mock data, click sidebar, verify badge rendering, close behavior

## Effort Summary

| Phase | Estimated Hours |
|-------|-----------------|
| Phase 1: Build-Time Parser | 2.5h |
| Phase 2: Header Icon + Hook | 1.0h |
| Phase 3: What's New Panel | 2.5h |
| Phase 4: Mobile Responsive | 0.5h |
| Phase 5: Testing | 1.5h |
| **Total** | **8.0h** |

## Dependencies

### Internal
- `CHANGELOG.md` — already maintained, format is compatible
- `package.json` version field — currently `0.1.0`, should be updated to `0.5.0`
- `App.tsx` header — add icon between UserMenu and theme toggle
- `.gitignore` — add `src/generated/` directory

### External
- None — entirely frontend + build-time

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `scripts/parse-changelog.ts` | CHANGELOG.md → structured JSON parser |
| `src/generated/changelog.ts` | Build-time generated changelog data (gitignored) |
| `src/types/changelog.ts` | TypeScript types for changelog data |
| `src/hooks/useChangelog.ts` | Version comparison + localStorage hook |
| `src/components/WhatsNewPanel.tsx` | Two-panel changelog viewer modal |
| `src/components/WhatsNewPanel.test.tsx` | Component tests |
| `src/hooks/useChangelog.test.ts` | Hook tests |
| `scripts/parse-changelog.test.ts` | Parser unit tests |

### Modified Files
| File | Change |
|------|--------|
| `vite.config.ts` | Add changelog Vite plugin |
| `src/App.tsx` | Add What's New icon + notification dot in header, mount WhatsNewPanel |
| `package.json` | Update version to `0.5.0` |
| `.gitignore` | Add `src/generated/` |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CHANGELOG.md format inconsistencies | Low | Medium | Parser handles gracefully, logs warnings, skips malformed entries |
| Build plugin compatibility | Low | Low | Simple file generation, no complex Vite API needed |
| Two-panel layout complexity | Low | Low | Follows existing modal pattern, Tailwind grid |
| package.json version drift | Medium | Low | Could also read from git tag as fallback |

## Spec Traceability

| AC | Task(s) | Phase |
|----|---------|-------|
| AC-001 | TASK-005 | 2 |
| AC-002 | TASK-004 | 2 |
| AC-003 | TASK-004 | 2 |
| AC-004 | TASK-006 | 3 |
| AC-005 | TASK-006 | 3 |
| AC-006 | TASK-007 | 3 |
| AC-007 | TASK-007 | 3 |
| AC-008 | TASK-007 | 3 |
| AC-009 | TASK-008 | 3 |
| AC-010 | TASK-008 | 3 |
| AC-011 | TASK-006 | 3 |
| AC-012 | TASK-004 | 2 |
| AC-013 | TASK-004 | 2 |
| AC-014 | TASK-001 | 1 |
| AC-015 | TASK-002 | 1 |
| AC-016 | TASK-001 | 1 |
| AC-017 | TASK-003 | 1 |
| AC-018 | TASK-002 | 1 |
| AC-019 | TASK-006 | 3 |
| AC-020 | TASK-009 | 4 |
| AC-021 | TASK-006 | 3 |
| AC-022 | TASK-009 | 4 |
| AC-023 | TASK-001 | 1 |

## Next Steps

1. Review and approve this plan
2. Run `/add:tdd-cycle specs/changelog-notification.md` to execute
3. Update `package.json` version to `0.5.0` before build
