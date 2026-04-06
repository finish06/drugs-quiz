# Spec: Changelog Notification ("What's New")

**Version:** 0.1.0
**Created:** 2026-03-29
**PRD Reference:** docs/prd.md
**Status:** Complete

## 1. Overview

A customer-facing "What's New" feature that keeps users informed about new features, improvements, and bug fixes. A notification dot in the header signals unseen updates. Clicking it opens a two-panel changelog view: version sidebar on the left, categorized entries on the right. Content is parsed from CHANGELOG.md at build time so it stays in sync with releases automatically.

### User Story

As a pharmacy student using Rx Quiz, I want to know when new features or improvements are available so that I can take advantage of them and feel confident the app is actively maintained.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A "What's New" icon appears in the header bar near the theme toggle | Must |
| AC-002 | A notification dot appears on the icon when the current app version is newer than the user's last-seen version | Must |
| AC-003 | The last-seen version is stored in localStorage under a dedicated key | Must |
| AC-004 | Clicking the icon opens a "What's New" panel/drawer/modal | Must |
| AC-005 | The panel has a two-panel layout: version sidebar (left) and entry content (right) | Must |
| AC-006 | The version sidebar lists all versions with version number and date, most recent first | Must |
| AC-007 | Clicking a version in the sidebar scrolls/selects to show that version's entries on the right | Must |
| AC-008 | The active/selected version is visually highlighted in the sidebar (e.g., blue text + left border) | Must |
| AC-009 | Each changelog entry has a category badge: "NEW" (green), "IMPROVEMENT" (blue), or "BUG FIX" (red/orange) | Must |
| AC-010 | Each entry has a title and a 1-2 sentence description in plain, customer-facing language | Must |
| AC-011 | The panel defaults to showing the latest version's entries when opened | Must |
| AC-012 | Closing the panel updates the last-seen version in localStorage to the current app version | Must |
| AC-013 | After closing, the notification dot disappears (until the next deploy with a new version) | Must |
| AC-014 | Changelog content is parsed from `CHANGELOG.md` at build time via a Vite plugin or build script | Must |
| AC-015 | The build output is a JSON file or inline module with structured changelog data | Must |
| AC-016 | The CHANGELOG.md parser maps "Added" → NEW, "Changed"/"Performance" → IMPROVEMENT, "Fixed" → BUG FIX | Must |
| AC-017 | Technical entries (internal tooling, CI/CD, test infrastructure) are filtered out — only user-facing changes appear | Should |
| AC-018 | The current app version is embedded at build time (e.g., from package.json or git tag) | Must |
| AC-019 | The panel works in both light and dark mode | Must |
| AC-020 | The panel is responsive — on mobile, the sidebar collapses to a version dropdown or stacks vertically | Should |
| AC-021 | The panel can be closed via an X button or clicking outside | Must |
| AC-022 | On mobile (narrow screens), the two-panel layout collapses to a single-column view with version headers as separators | Should |
| AC-023 | Entry descriptions use customer-facing language, not developer jargon (parsed from bold text in CHANGELOG.md entries) | Must |

## 3. User Test Cases

### TC-001: New user sees notification dot on first visit

**Precondition:** User has never visited the app before (no localStorage)
**Steps:**
1. Open the app
2. Look at the header
**Expected Result:** A notification dot appears on the "What's New" icon, since no last-seen version exists.
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-01-dot-visible.png
**Maps to:** TBD

### TC-002: Opening What's New shows two-panel layout

**Precondition:** Notification dot is visible
**Steps:**
1. Click the "What's New" icon in the header
**Expected Result:** A panel opens with version sidebar on the left and categorized entries on the right. The latest version is selected and highlighted. Entries show category badges (NEW, IMPROVEMENT, BUG FIX).
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-02-panel-open.png
**Maps to:** TBD

### TC-003: Navigating between versions in the sidebar

**Precondition:** What's New panel is open, latest version selected
**Steps:**
1. Click an older version in the sidebar (e.g., v0.3.0)
**Expected Result:** The right panel updates to show v0.3.0 entries. The sidebar highlights v0.3.0 as active. Previous version is no longer highlighted.
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-03-version-switch.png
**Maps to:** TBD

### TC-004: Closing the panel dismisses the notification dot

**Precondition:** What's New panel is open, notification dot was visible
**Steps:**
1. Click the X button to close the panel
2. Observe the header icon
**Expected Result:** The notification dot is gone. localStorage contains the current app version as the last-seen version.
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-04-dot-dismissed.png
**Maps to:** TBD

### TC-005: No notification dot when already seen

**Precondition:** User previously opened What's New for the current version
**Steps:**
1. Reload the page
2. Look at the header
**Expected Result:** No notification dot on the What's New icon. Clicking it still opens the panel.
**Maps to:** TBD

### TC-006: New deploy triggers notification dot again

**Precondition:** User saw v0.5.0. App is now deployed at v0.6.0.
**Steps:**
1. Open the app
**Expected Result:** Notification dot reappears on the What's New icon. Opening the panel shows v0.6.0 entries at the top.
**Maps to:** TBD

### TC-007: Dark mode styling

**Precondition:** Device is in dark mode
**Steps:**
1. Open the What's New panel
**Expected Result:** Panel background, text, badges, and sidebar all render with dark mode colors and sufficient contrast.
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-07-dark-mode.png
**Maps to:** TBD

### TC-008: Mobile responsive layout

**Precondition:** Viewport width < 640px
**Steps:**
1. Open the What's New panel
**Expected Result:** The sidebar collapses — versions appear as stacked headers/separators in a single-column scrollable view instead of a two-panel layout.
**Screenshot Checkpoint:** tests/screenshots/changelog-notification/step-08-mobile.png
**Maps to:** TBD

## 4. Data Model

### ChangelogEntry (build-time generated)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | string | Yes | Semantic version (e.g., "0.5.0") |
| date | string | Yes | Release date (e.g., "March 29, 2026") |
| entries | ChangelogItem[] | Yes | List of individual changes |

### ChangelogItem

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | "new" \| "improvement" \| "fix" | Yes | Maps from Added/Changed/Fixed in CHANGELOG.md |
| title | string | Yes | Short headline (parsed from bold text in CHANGELOG.md entry) |
| description | string | No | Remaining text after the title, customer-facing |

### Build Output

A generated module (e.g., `src/generated/changelog.ts`) or JSON file imported by the frontend:

```typescript
export const changelog: ChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "March 29, 2026",
    entries: [
      { category: "new", title: "Google Sign-In", description: "Sign in with your Google account to sync quiz history across devices." },
      { category: "new", title: "Shareable Score Cards", description: "Generate a public link to share your quiz results with classmates." },
    ],
  },
  // ...
];

export const appVersion = "0.5.0";
```

### localStorage

| Key | Type | Description |
|-----|------|-------------|
| `dq-changelog-seen` | string | Last-seen app version (e.g., "0.5.0") |

## 5. API Contract

N/A — all data is embedded at build time. No API calls needed.

## 6. UI Behavior

### Header Icon

- **Position:** In the header bar, between UserMenu and theme toggle
- **Icon:** Megaphone, sparkle, or bell icon (small, consistent with existing header icons)
- **Notification dot:** Small colored circle (brand blue or red) in the top-right corner of the icon, visible when `appVersion > lastSeenVersion`
- **Click:** Opens the What's New panel

### What's New Panel

- **Trigger:** Click the header icon
- **Type:** Modal overlay or slide-in drawer (consistent with MigrationModal pattern)
- **Close:** X button in top-right corner, or click outside the panel

### Two-Panel Layout (desktop, >= 640px)

```
┌──────────────────────────────────────────────────┐
│  What's New                                   X  │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  v0.5.0    │  v0.5.0  March 29, 2026             │
│  March 2026│  ─────────────────────              │
│  (active)  │                                     │
│            │   NEW                               │
│  v0.4.0    │  Google Sign-In — Sign in with      │
│  March 2026│  your Google account to sync quiz   │
│            │  history across devices.             │
│  v0.3.1    │                                     │
│  March 2026│   NEW                               │
│            │  Shareable Score Cards — Generate    │
│  v0.3.0    │  a link to share your quiz results  │
│  March 2026│  with classmates.                   │
│            │                                     │
│  v0.2.0    │   IMPROVEMENT                       │
│  March 2026│  Cloud Session Sync — Your quiz     │
│            │  history now syncs across devices    │
│  v0.1.0    │  when you sign in.                  │
│  March 2026│                                     │
│            │   BUG FIX                           │
│            │  Quiz Loading — Fixed a rare issue  │
│            │  where quizzes could fail to load.  │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### Single-Column Layout (mobile, < 640px)

```
┌──────────────────────────┐
│  What's New           X  │
├──────────────────────────┤
│                          │
│  v0.5.0  March 29, 2026  │
│  ────────────────────    │
│                          │
│   NEW                    │
│  Google Sign-In — ...    │
│                          │
│   NEW                    │
│  Shareable Scores — ...  │
│                          │
│  v0.4.0  March 22, 2026  │
│  ────────────────────    │
│                          │
│   IMPROVEMENT            │
│  E2E Testing — ...       │
│                          │
└──────────────────────────┘
```

### Category Badge Colors

| Badge | Light Mode | Dark Mode |
|-------|-----------|-----------|
| NEW | Green bg (#dcfce7), green text (#166534) | Dark green bg, light green text |
| IMPROVEMENT | Blue bg (#dbeafe), blue text (#1e40af) | Dark blue bg, light blue text |
| BUG FIX | Orange bg (#ffedd5), orange text (#9a3412) | Dark orange bg, light orange text |

### States

- **No updates:** Icon visible, no notification dot. Clicking still opens the panel.
- **Unseen updates:** Icon visible with notification dot.
- **Panel open:** Overlay/modal with two-panel layout. Scrollable sidebar and content.
- **Panel closed:** Notification dot cleared, localStorage updated.

### Screenshot Checkpoints

| Step | Description | Path |
|------|-------------|------|
| 1 | Header with notification dot | tests/screenshots/changelog-notification/step-01-dot.png |
| 2 | Panel open, latest version selected | tests/screenshots/changelog-notification/step-02-panel.png |
| 3 | Older version selected in sidebar | tests/screenshots/changelog-notification/step-03-switch.png |
| 4 | Dark mode panel | tests/screenshots/changelog-notification/step-04-dark.png |
| 5 | Mobile single-column layout | tests/screenshots/changelog-notification/step-05-mobile.png |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| CHANGELOG.md is empty or malformed | Build script logs a warning; frontend shows empty state: "No updates yet" |
| User clears localStorage | Notification dot reappears as if first visit |
| Version in localStorage is newer than app version (downgrade/rollback) | Treat as "seen" — no dot. Don't show notification for older versions |
| CHANGELOG.md entry has no bold text (no title) | Use the full line as the title, no description |
| Very long entry text | Truncate description at ~200 characters with ellipsis |
| First-ever visit (no localStorage, no previous version) | Show notification dot; opening panel shows all versions |
| Build runs but CHANGELOG.md doesn't exist | Build script creates an empty changelog module; no runtime error |

## 8. Dependencies

- `CHANGELOG.md` — source of truth for changelog content (already maintained)
- Vite build pipeline — needs a plugin or script to parse CHANGELOG.md at build time
- `package.json` version field or git tags — for embedding current app version
- Header component in `App.tsx` — icon placement
- Existing dark mode system (`useTheme`) — for consistent styling
- No backend/BFF dependencies — entirely frontend + build-time

### CHANGELOG.md Format Requirements

The parser expects the existing Keep a Changelog format:

```markdown
## [0.5.0] - 2026-03-29

### Added
- **Title** — Description text here

### Changed
- **Title** — Description text here

### Fixed
- **Title** — Description text here
```

Section mapping:
- `### Added` → category: "new"
- `### Changed`, `### Performance` → category: "improvement"
- `### Fixed` → category: "fix"

Entries starting with `**bold text**` are parsed as title + description. Entries without bold text use the full line as the title.

## 9. Out of Scope

- Server-side changelog storage or API
- Push notifications for new versions
- Per-entry "learn more" links
- User feedback/reactions on entries
- Filtering or search within changelog
- Changelog for BFF/backend changes (frontend-facing only)

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-29 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
