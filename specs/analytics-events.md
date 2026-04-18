# Spec: Analytics Event Tracking

**Version:** 0.1.0
**Created:** 2026-04-12
**PRD Reference:** docs/prd.md
**Milestone:** M7 — Study Experience
**Status:** Complete

## 1. Overview

Track key user interactions via Umami analytics using `data-umami-event` attributes for automatic event capture. Events cover quiz starts, authentication, and feature engagement to measure product usage without any external SDK — Umami reads the data attributes natively.

### User Story

As the product owner, I want to see which quiz types are most popular, how many users sign in, and which features are used so that I can prioritize improvements based on real usage data.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | The "Start Quiz" button fires a `quiz-start` event with quiz type, question count, and timed mode | Must |
| AC-002 | The "Quick 5" button fires a `quiz-start` event with type `quick-5` | Must |
| AC-003 | The "Sign in" / "Sign in with Google" button fires a `sign-in-click` event | Must |
| AC-004 | The "My Progress" button fires a `view-progress` event | Must |
| AC-005 | All events use `data-umami-event` attributes (no JavaScript tracking calls) | Must |
| AC-006 | Events include relevant properties via `data-umami-event-*` attributes | Should |
| AC-007 | Events fire in both light and dark mode | Must |
| AC-008 | Events fire for both authenticated and unauthenticated users | Must |
| AC-009 | No events fire in local development if Umami script is not loaded | Must |

## 3. Event Catalog

| Event Name | Trigger | Properties | Component |
|------------|---------|------------|-----------|
| `quiz-start` | Click "Start Quiz" | `type`: quiz type, `questions`: count, `timed`: duration or "off" | QuizConfig.tsx |
| `quiz-start` | Click "Quick 5" | `type`: "quick-5" | Quick5Button.tsx |
| `sign-in-click` | Click "Sign in" button | — | UserMenu.tsx |
| `sign-in-click` | Click "Sign in with Google" on progress CTA | `source`: "progress-dashboard" | ProgressDashboard.tsx |
| `view-progress` | Click "My Progress" | — | QuizConfig.tsx |

## 4. User Test Cases

### TC-001: Quiz start events tracked

**Precondition:** App is loaded with Umami script
**Steps:**
1. Select "Name the Class", 10 questions, timed 30s
2. Click "Start Quiz"
**Expected Result:** Umami records event `quiz-start` with properties `type=name-the-class`, `questions=10`, `timed=30s`
**Maps to:** TBD

### TC-002: Quick 5 event tracked

**Precondition:** App is loaded
**Steps:**
1. Click "Quick 5"
**Expected Result:** Umami records event `quiz-start` with property `type=quick-5`
**Maps to:** TBD

### TC-003: Sign-in click tracked

**Precondition:** User is not signed in
**Steps:**
1. Click "Sign in" in the header
**Expected Result:** Umami records event `sign-in-click`
**Maps to:** TBD

### TC-004: My Progress click tracked

**Precondition:** App is loaded
**Steps:**
1. Click "My Progress"
**Expected Result:** Umami records event `view-progress`
**Maps to:** TBD

### TC-005: Sign-in from progress dashboard tracked

**Precondition:** User is not signed in, on progress dashboard
**Steps:**
1. Click "Sign in with Google" CTA on progress dashboard
**Expected Result:** Umami records event `sign-in-click` with property `source=progress-dashboard`
**Maps to:** TBD

## 5. Implementation Notes

Umami auto-tracks events via HTML data attributes — no JavaScript API calls needed:

```html
<button
  data-umami-event="quiz-start"
  data-umami-event-type="name-the-class"
  data-umami-event-questions="10"
  data-umami-event-timed="30s"
>
  Start Quiz
</button>
```

### Already Implemented
- AC-001: `QuizConfig.tsx` — Start Quiz button
- AC-002: `Quick5Button.tsx` — Quick 5 button

### Needs Implementation
- AC-003: `UserMenu.tsx` — Sign in button
- AC-003: `ProgressDashboard.tsx` — Sign in with Google CTA
- AC-004: `QuizConfig.tsx` — My Progress button

## 6. Dependencies

- Umami script loaded in `index.html` (already configured)
- `VITE_UMAMI_WEBSITE_ID` env var (already configured)
- No backend changes needed

## 7. Out of Scope

- Server-side event tracking
- Custom Umami API calls
- Quiz completion events (would require JS tracking, not just data attributes)
- Funnel analysis setup in Umami dashboard

## 8. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-04-12 | 0.1.0 | Caleb Dunn | Initial spec — retroactive for existing events + new sign-in and progress tracking |
