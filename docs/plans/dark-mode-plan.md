# Implementation Plan: Dark Mode

**Spec Version:** 0.1.0
**Created:** 2026-03-16
**Team Size:** Solo
**Estimated Duration:** 2-3 hours

## Overview

Add class-based dark mode using Tailwind's `dark:` variant. Create a `useTheme` hook for OS detection, localStorage persistence, and toggle. Apply `dark:` classes to all components.

## Approach

Tailwind 4 supports `dark:` variants out of the box. The implementation:
1. Configure Tailwind for class-based dark mode
2. Create `useTheme` hook (OS detection + localStorage + toggle)
3. Add toggle button to App header
4. Apply `dark:` classes to every component

No architectural changes — this is purely CSS + one hook + component class additions.

## Acceptance Criteria Analysis

### AC-001 + AC-003: OS preference + localStorage persistence
- **Complexity:** Medium
- **Tasks:** Create `useTheme` hook with `matchMedia` listener and localStorage
- **Dependencies:** None

### AC-002: Toggle button in header
- **Complexity:** Simple
- **Tasks:** Sun/moon SVG icon button in App.tsx header

### AC-004: Dark mode on all screens
- **Complexity:** Medium (repetitive but straightforward)
- **Tasks:** Add `dark:` classes to QuizConfig, MultipleChoice, MatchingQuiz, QuizResults, App (loading/error)

### AC-005-009: Color adjustments, contrast, transitions
- **Complexity:** Simple
- **Tasks:** Applied alongside AC-004 via correct `dark:` color choices

## Implementation Phases

### Phase 1: useTheme Hook + Tailwind Config (~30 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-001 | Configure Tailwind 4 for class-based dark mode (CSS `@custom-variant`) | 10min | AC-004 |
| TASK-002 | Create `useTheme` hook: OS detection via `matchMedia('prefers-color-scheme: dark')`, localStorage read/write, toggle function, apply `dark` class to `document.documentElement` | 15min | AC-001, AC-003 |
| TASK-003 | Write tests for `useTheme`: OS preference detection, localStorage persistence, toggle, invalid localStorage, OS change listener | 15min | AC-001, AC-003 |

### Phase 2: Toggle Button + App Shell (~15 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-004 | Add theme toggle button (sun/moon icon) to App.tsx header | 10min | AC-002 |
| TASK-005 | Add `dark:` classes to App.tsx: page bg, header, loading state, error state | 5min | AC-004 |
| TASK-006 | Update App.test.tsx for toggle button | 5min | AC-002 |

### Phase 3: Component Dark Mode (~45 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-007 | QuizConfig.tsx: dark card bg, borders, text, selected states, Start button | 10min | AC-004, AC-006 |
| TASK-008 | MultipleChoice.tsx: dark card, options, correct/incorrect feedback colors | 10min | AC-004, AC-007 |
| TASK-009 | MatchingQuiz.tsx: dark card, pair colors, submitted feedback, correct answers panel | 15min | AC-004, AC-007, AC-008 |
| TASK-010 | QuizResults.tsx: dark card, stats panel, breakdown dots, buttons | 10min | AC-004 |

### Phase 4: Polish + Verify (~30 min)

| Task ID | Description | Effort | AC |
|---------|-------------|--------|-----|
| TASK-011 | Add `transition-colors duration-150` to html element for smooth switching | 5min | AC-009 |
| TASK-012 | Verify WCAG contrast ratios on all dark mode text/bg combinations | 10min | AC-005 |
| TASK-013 | Run full test suite + coverage check | 10min | All |
| TASK-014 | E2E test: toggle dark mode, verify class applied | 10min | AC-002 |

## Effort Summary

| Phase | Estimated | Tasks |
|-------|-----------|-------|
| Phase 1: Hook + Config | 40 min | 3 |
| Phase 2: Toggle + App Shell | 20 min | 3 |
| Phase 3: Component Dark Mode | 45 min | 4 |
| Phase 4: Polish + Verify | 35 min | 4 |
| **Total** | **~2.5 hours** | **14** |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Tailwind 4 dark mode config differs from v3 | Medium | Low | Check Tailwind 4 docs for `@custom-variant` syntax |
| Missing `dark:` on some element | Medium | Low | Visual review of every screen in dark mode |
| Test environment lacks `matchMedia` | Medium | Low | Mock `window.matchMedia` in test setup |

## Key Implementation Details

### useTheme Hook API

```typescript
function useTheme(): {
  theme: "light" | "dark";
  toggleTheme: () => void;
}
```

### Tailwind 4 Dark Mode Config

Tailwind 4 uses CSS-based configuration. For class-based dark mode:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### Dark Class Application

The hook adds/removes `dark` class on `document.documentElement`:
```typescript
useEffect(() => {
  document.documentElement.classList.toggle("dark", theme === "dark");
}, [theme]);
```

## Deliverables

### Files Created
- `src/hooks/useTheme.ts` — theme management hook
- `src/hooks/useTheme.test.ts` — hook tests

### Files Modified
- `src/index.css` — Tailwind dark mode variant config
- `src/App.tsx` — toggle button + dark classes
- `src/App.test.tsx` — toggle test
- `src/components/QuizConfig.tsx` — dark classes
- `src/components/MultipleChoice.tsx` — dark classes
- `src/components/MatchingQuiz.tsx` — dark classes + pair colors
- `src/components/QuizResults.tsx` — dark classes

## Next Steps

1. Approve this plan
2. Implement with TDD: hook tests first, then component updates
3. Visual review in browser (both modes)
4. Deploy to staging

## Plan History

| Date | Changes |
|------|---------|
| 2026-03-16 | Initial plan created |
