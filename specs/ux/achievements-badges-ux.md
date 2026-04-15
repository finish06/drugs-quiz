# UX Design: achievements-badges

**Spec:** specs/achievements-badges.md
**Status:** APPROVED
**Approved:** 2026-04-14
**Iterations:** 1

## Screens

### Screen 1: Badges Page (route: `/badges`)

Layout: **2-col grid on small/medium screens, 3-col at `lg:` breakpoint (≥1024px).** Two sections: Earned (colored, earn-date shown) and Locked (greyed, criteria shown).

**Populated state (2 earned of 5):**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back    Badges                              🌙 Theme  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Your Achievements              2 of 5 earned            │
│  ──────────────────────────────────────                  │
│                                                          │
│  ╔════════════╗  ╔════════════╗                          │
│  ║  [Trophy]  ║  ║  [Target]  ║                          │
│  ║  First     ║  ║  Perfect   ║                          │
│  ║  Quiz      ║  ║  Score     ║                          │
│  ║ Apr 13     ║  ║ Apr 14     ║                          │
│  ╚════════════╝  ╚════════════╝                          │
│                                                          │
│  Locked                                                  │
│  ──────────────────────────────────────                  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  [Award]   │  │  [Medal]   │  │  [Flame]   │          │
│  │  Class     │  │ Centurion  │  │ Streak     │          │
│  │  Master    │  │            │  │ Seeker     │          │
│  │ 100% on a  │  │ Answer     │  │ 7 days in  │          │
│  │ class      │  │ 100 Qs     │  │ a row      │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Tailwind grid:** `grid grid-cols-2 lg:grid-cols-3 gap-4`.

**Empty state (brand new user):**
```
┌──────────────────────────────────────────────────────────┐
│  ← Back    Badges                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│        Complete a quiz to earn your first badge!         │
│                                                          │
│  Locked   (0 of 5 earned)                                │
│  ──────────────────────────────────────                  │
│  (all 5 greyed-out cards with criteria shown)            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Guest banner (unauthenticated, shown above grid):**
```
┌──────────────────────────────────────────────────────────┐
│ 💾 Sign in to keep your badges across devices. [Sign in] │
└──────────────────────────────────────────────────────────┘
```

**Card anatomy:**
- Earned: colored icon (lucide-react, ~32px), accent gradient bg, bold name, small earn-date
- Locked: greyscale icon, muted bg, name, small criteria line
- Border radius: `rounded-2xl`. Card padding: `p-4`.
- Earned cards get a subtle ring or glow (`ring-1 ring-accent/30`)
- Icons: `lucide-react` — `Trophy` (First Quiz), `Target` (Perfect Score), `Award` (Class Master), `Medal` (Centurion), `Flame` (Streak Seeker)

### Screen 2: Unlock Toast (on QuizResults)

Appears in top-right corner. Stacks vertically when multiple badges unlock in the same session.
```
                                  ┌─────────────────────────┐
                                  │  [Target] Perfect Score │
                                  │    unlocked!         ✕  │
                                  └─────────────────────────┘
                                  ┌─────────────────────────┐
                                  │  [Medal] Centurion      │
                                  │    unlocked!         ✕  │
                                  └─────────────────────────┘
```

- **Position:** `fixed top-4 right-4` (responsive: on mobile `top-4 right-2 left-2` — full-width minus gutter)
- **Duration:** 5s auto-dismiss per toast
- **Stacking:** each subsequent toast staggered by 300ms, stacks below the previous
- **Dismiss:** click anywhere on toast OR press `Esc` (dismisses top-most)
- **A11y:** container has `role="status"`, `aria-live="polite"`; icon has `aria-hidden`, visible text announces the badge
- **Animation:** slide in from right (translate-x → 0), fade out on dismiss

### Screen 3: Progress Dashboard "Recent Badges" Widget

Drops in as a card alongside existing dashboard stats. Shows last 3 earned.
```
┌─────────────────────────────────────┐
│  Recent Badges                      │
│  ──────────────────────             │
│  [Target][Trophy][Award]            │
│  Today    Apr13   Apr12             │
│                                     │
│  View all →                         │
└─────────────────────────────────────┘
```

- **Hidden when user has 0 badges earned** (reduces dashboard clutter for new users)
- "View all →" links to `/badges`
- Icon row: 3 icons in a row with earn-date beneath each
- Matches dashboard card styling (same `rounded-2xl`, `p-4`, border)

## State Matrix

| State | Badges Page | Toast | Dashboard Widget |
|---|---|---|---|
| Loading | skeleton grid (5 rounded placeholders pulsing) | n/a | skeleton card |
| Empty | encouragement + locked grid | n/a | **hidden** |
| Error | inline error + Retry button | n/a | hidden (fails silently) |
| Success | earned-first grid with earn dates | slide-in, 5s auto-dismiss | top 3 badges + "View all" |
| Guest | + sign-in banner; localStorage-sourced badges | slide-in from localStorage unlocks | n/a (no dashboard for guests) |

## Flow

```
Quiz in progress
     │
     ▼
QuizResults render
     │
     ├─► session POST /api/sessions
     │       │
     │       ▼
     │   POST /api/achievements/check { sessionId }
     │       │
     │       ▼
     │   newly unlocked[] → stacked toasts (top-right)
     │
     ▼
User clicks "View badges" in UserMenu
     │
     ▼
Navigate to /badges
     │
     ▼
GET /api/achievements → render earned + locked sections
```

Guest path: the same flow but unlock evaluation runs in the browser, localStorage is the source, sign-in banner is shown.

## Key Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Responsive 2-col / 3-col (lg+) | Works on phones without squishing; desktop uses extra width | Fixed 3-col (too tight on mobile); 1-col (wastes desktop space) |
| lucide-react for icons | Consistent SVG system, tree-shakeable, scales cleanly, a11y-friendly | Emoji (inconsistent rendering, a11y weaker); custom SVGs (dev overhead) |
| Two sections (Earned / Locked) | Shows progress forward, makes unearned badges aspirational | Single mixed grid (earned badges get lost); modal-only reveal (less discoverable) |
| Locked cards show criteria inline | Users know what to do next without extra tap | Tooltip on hover (breaks on mobile); separate "how to earn" page (too indirect) |
| Toast stacks, 300ms stagger | Multi-unlock moments feel rewarding; stagger gives each badge a beat | Single combined toast (loses per-badge celebration); queue serially (feels slow) |
| Toast top-right, 5s dismiss | Non-blocking; long enough to read, short enough not to linger | Bottom-center (overlaps mobile nav); modal (too heavy for non-blocking info) |
| Dashboard widget hides at 0 badges | Avoids empty-state clutter on the dashboard | Always-show with "no badges yet" (redundant with /badges empty state) |
| Badges page as route, not modal | Shareable URL, browser back works, easier E2E | Modal-only (no deep-linking) |

## Dependencies

- **Add to `package.json`:** `lucide-react` (latest stable). Confirm tree-shaking in Vite build — bundle size delta should be <5KB for these 5 icons.
- Tailwind 4 (existing) covers layout and responsive breakpoints.
- Existing dashboard component needs a new widget slot for "Recent Badges".

## Figma Reference

N/A — wireframes generated in session.

## Spec Notes

The spec's Section 6 (UI Behavior) and Section 8 (Dependencies) are accurate as-written after this UX session. One clarification added to the spec:
- `lucide-react` confirmed as new dependency (spec previously said "verify" — now decided)
- 2-col / 3-col responsive grid added as implementation detail
- Toast position (top-right), duration (5s), and stagger (300ms) are now fixed specifications
