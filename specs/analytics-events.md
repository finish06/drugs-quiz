# Feature Spec: Analytics Event Tracking

**Status:** Complete
**Milestone:** M6 — Observability
**PRD Reference:** docs/prd.md

## Description

Instrument quiz-start interactions with Umami analytics event tracking via HTML `data-umami-event` attributes. This enables product analytics to understand which quiz types users choose, how many questions they select, and whether they use timed mode — without any JavaScript tracking code.

## User Story

As a product owner, I want to see which quiz types users start so that I can prioritize content and features for the most popular modes.

## Acceptance Criteria

1. **AC-001:** The "Start Quiz" button emits a `quiz-start` Umami event on click with properties: `type` (quiz type), `questions` (count), `timed` (time limit or "off").
2. **AC-002:** The "Quick 5" button emits a `quiz-start` Umami event on click with property `type` set to `"quick-5"`.
3. **AC-003:** The `type` property on the "Start Quiz" button reflects the currently selected quiz type (`name-the-class`, `match-drug-to-class`, or `brand-generic-match`).
4. **AC-004:** The `questions` property on the "Start Quiz" button reflects the currently selected question count.
5. **AC-005:** The `timed` property reads `"off"` when timed mode is disabled, and `"{N}s"` (e.g. `"30s"`) when enabled.
6. **AC-006:** Tracking is implemented via `data-umami-event` HTML attributes only — no JavaScript `umami.track()` calls required.

## User Test Cases

1. **TC-001:** Load the quiz config screen. Inspect the "Start Quiz" button — it has `data-umami-event="quiz-start"`, `data-umami-event-type="name-the-class"`, `data-umami-event-questions="10"`, `data-umami-event-timed="off"`.
2. **TC-002:** Select "Brand/Generic Match" and 20 questions. The button attributes update to `type="brand-generic-match"` and `questions="20"`.
3. **TC-003:** Enable timed mode, select 30s. The `timed` attribute updates to `"30s"`.
4. **TC-004:** Click "Quick 5". Inspect button — it has `data-umami-event="quiz-start"` and `data-umami-event-type="quick-5"`.

## Data Model

No persistent data model. Umami's tracker script reads `data-umami-event*` attributes from clicked elements and sends them to the Umami server as event payloads.

```typescript
// Umami event payload (sent automatically by tracker script)
interface UmamiEvent {
  name: "quiz-start";
  data: {
    type: "name-the-class" | "match-drug-to-class" | "brand-generic-match" | "quick-5";
    questions?: string;  // "5" | "10" | "15" | "20"
    timed?: string;      // "off" | "30s" | "60s" | "90s"
  };
}
```

## API Contract

None — tracking is client-side only via Umami's hosted script.

## Edge Cases

- If Umami script fails to load (ad blocker, network error), the attributes are inert — no errors, no impact on quiz functionality.
- Attributes are static HTML; they do not depend on any runtime analytics library being present.

## Screenshot Checkpoints

1. Browser DevTools showing `data-umami-event` attributes on the Start Quiz button.
2. Umami dashboard showing `quiz-start` events broken down by `type`.
