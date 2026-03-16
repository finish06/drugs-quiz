# Spec: Dark Mode

**Version:** 0.1.0
**Created:** 2026-03-16
**PRD Reference:** docs/prd.md §8 Non-Functional Requirements (Accessibility)
**Status:** Complete

## 1. Overview

Add a dark mode theme to the app with a toggle in the header. Respects the user's OS color scheme preference by default, with manual override persisted in localStorage.

### User Story

As a pharmacy student studying at night, I want a dark mode so that the bright white screen doesn't strain my eyes during long study sessions.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | App defaults to user's OS color scheme preference (`prefers-color-scheme`) on first visit | Must |
| AC-002 | A toggle button in the header switches between light and dark mode | Must |
| AC-003 | User's theme choice is persisted in localStorage and restored on subsequent visits | Must |
| AC-004 | Dark mode applies to all screens: config, quiz (multiple choice + matching), results, error, loading | Must |
| AC-005 | All text meets WCAG 2.1 AA contrast ratio (4.5:1 minimum) in both modes | Must |
| AC-006 | Brand accent color (#3b82f6) remains consistent across both modes | Must |
| AC-007 | Correct/incorrect feedback colors (green/red) are adjusted for dark background contrast | Should |
| AC-008 | Matching quiz pair colors are adjusted for dark background visibility | Should |
| AC-009 | Theme transition uses a subtle CSS transition (150-200ms) for background/text color changes | Nice |

## 3. User Test Cases

### TC-001: OS preference is respected on first visit

**Precondition:** No localStorage theme value set. OS is set to dark mode.
**Steps:**
1. Open the app for the first time
2. Observe the theme
**Expected Result:** App renders in dark mode matching OS preference.
**Screenshot Checkpoint:** tests/screenshots/dark-mode/tc-001-os-dark.png
**Maps to:** TBD

### TC-002: Toggle switches to light mode

**Precondition:** App is in dark mode (OS preference).
**Steps:**
1. Click the theme toggle in the header
2. Observe the theme change
**Expected Result:** App switches to light mode. Toggle icon changes to indicate current mode.
**Screenshot Checkpoint:** tests/screenshots/dark-mode/tc-002-toggle-light.png
**Maps to:** TBD

### TC-003: Choice persists across sessions

**Precondition:** User has manually toggled to dark mode.
**Steps:**
1. Close the browser tab
2. Reopen the app
**Expected Result:** App loads in dark mode (from localStorage), regardless of OS preference.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-004: Dark mode on quiz screen

**Precondition:** App is in dark mode.
**Steps:**
1. Start a "Name the Class" quiz
2. Answer a question correctly
3. Answer a question incorrectly
**Expected Result:** Question card, options, progress bar, and feedback colors all render correctly on dark background. Green/red feedback is clearly visible.
**Screenshot Checkpoint:** tests/screenshots/dark-mode/tc-004-quiz-dark.png
**Maps to:** TBD

### TC-005: Dark mode on matching quiz

**Precondition:** App is in dark mode.
**Steps:**
1. Start a "Match Drug to Class" quiz
2. Create 2 pairs
**Expected Result:** Pair colors (blue, purple, amber, teal) are visible and distinguishable on dark background.
**Screenshot Checkpoint:** tests/screenshots/dark-mode/tc-005-matching-dark.png
**Maps to:** TBD

### TC-006: Dark mode on results screen

**Precondition:** App is in dark mode. Quiz completed.
**Steps:**
1. View results screen
**Expected Result:** Score, breakdown dots, and buttons render correctly on dark background.
**Screenshot Checkpoint:** tests/screenshots/dark-mode/tc-006-results-dark.png
**Maps to:** TBD

## 4. Data Model

### localStorage

| Key | Type | Values | Description |
|-----|------|--------|-------------|
| `theme` | string | `"light"` \| `"dark"` \| absent | User's explicit theme choice. When absent, fall back to OS preference. |

No API or database changes needed.

## 5. API Contract

N/A — this is a purely frontend feature.

## 6. UI Behavior

### Theme Toggle Button
- **Location:** Header bar, right side (before "Exit" button when in quiz)
- **Icon:** Sun icon for light mode, moon icon for dark mode (shows current mode, click to switch)
- **Behavior:** Click toggles between light/dark, updates localStorage

### Dark Mode Color Palette

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `gray-50` (#f9fafb) | `gray-900` (#111827) |
| Card background | `white` (#ffffff) | `gray-800` (#1f2937) |
| Card border | `gray-200` | `gray-700` |
| Primary text | `gray-900` | `gray-100` |
| Secondary text | `gray-500` | `gray-400` |
| Label text | `gray-400` | `gray-500` |
| Header background | `white` | `gray-900` |
| Header border | `gray-200` | `gray-800` |
| Accent (brand) | `#3b82f6` | `#3b82f6` (unchanged) |
| Accent hover | `#1d5bbf` | `#6ba3f8` |
| Correct feedback | `green-500` bg `green-50` | `green-500` bg `green-900/30` |
| Incorrect feedback | `red-500` bg `red-50` | `red-500` bg `red-900/30` |
| Progress bar bg | `gray-100` | `gray-700` |
| Match pair blue | `blue-100` / `blue-400` | `blue-900/40` / `blue-400` |
| Match pair purple | `purple-100` / `purple-400` | `purple-900/40` / `purple-400` |
| Match pair amber | `amber-100` / `amber-400` | `amber-900/40` / `amber-400` |
| Match pair teal | `teal-100` / `teal-400` | `teal-900/40` / `teal-400` |

### Implementation Approach
- Use Tailwind's `dark:` variant with class-based dark mode (`darkMode: 'class'`)
- Apply `dark` class to `<html>` element based on resolved theme
- Create a `useTheme` hook that manages OS detection, localStorage, and toggle

### States
- **Light mode:** Current appearance (default for light OS preference)
- **Dark mode:** Dark backgrounds, light text, adjusted accent/feedback colors
- **Transition:** 150ms `transition-colors` on `html` element for smooth switching

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Home screen — dark mode | tests/screenshots/dark-mode/home-dark.png |
| 2 | Multiple choice — dark, answered correct | tests/screenshots/dark-mode/mc-correct-dark.png |
| 3 | Multiple choice — dark, answered incorrect | tests/screenshots/dark-mode/mc-incorrect-dark.png |
| 4 | Matching quiz — dark, pairs created | tests/screenshots/dark-mode/matching-pairs-dark.png |
| 5 | Results screen — dark | tests/screenshots/dark-mode/results-dark.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| OS preference changes while app is open | If user hasn't manually toggled (no localStorage value), follow the new OS preference live |
| localStorage has invalid value | Treat as absent, fall back to OS preference |
| Browser doesn't support `prefers-color-scheme` | Default to light mode |
| User clears localStorage | Reverts to OS preference on next load |

## 8. Dependencies

- Tailwind CSS `dark:` variant (already available in Tailwind 4)
- No new dependencies needed
- `useTheme` hook (new, ~30 lines)

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-16 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
