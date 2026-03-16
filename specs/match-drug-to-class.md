# Feature Spec: Match Drug to Class Quiz

**Status:** Complete
**Milestone:** M1 — MVP Quiz
**PRD Reference:** docs/prd.md §7 Feature 1

## Description

A matching quiz where 4 drug names are presented on the left and 4 pharmacological classes on the right (both shuffled). The user connects each drug to its correct class. This tests recognition of drug-class associations across multiple drugs simultaneously.

## User Story

As a pharmacy student, I want to match multiple drugs to their classes at once so that I can practice recognizing drug-class associations in a format similar to exam matching questions.

## Acceptance Criteria

1. **Layout:** Two columns — drug names on the left, class names on the right, both shuffled independently
2. **Interaction:** User selects a drug, then selects a class to create a match (or tap-tap on mobile)
3. **Visual pairing:** Matched pairs are visually connected (color-coded, lines, or similar indicator)
4. **Undo:** User can tap a matched pair to undo it before submitting
5. **Submit:** "Check Answers" button enabled when all 4 pairs are matched
6. **Feedback:** After submission, show which pairs are correct (green) and incorrect (red) with the correct answers
7. **Scoring:** Score is number of correct matches out of 4
8. **Progress indicator:** Shows current question number out of total

## User Test Cases

1. User sees 4 drug names on the left and 4 class names on the right
2. User taps "simvastatin" then taps "HMG-CoA Reductase Inhibitor" — they become paired
3. User taps the pair to undo it, both items become available again
4. User matches all 4 pairs and taps "Check Answers"
5. 3 correct, 1 incorrect — correct pairs show green, incorrect shows red with the right answer
6. User taps "Next" for the next matching set

## Data Model

```typescript
interface MatchingQuestion {
  kind: "matching";
  leftItems: string[];    // 4 drug names, shuffled
  rightItems: string[];   // 4 class names, shuffled
  correctPairs: Record<string, string>;  // drug -> class mapping
}
```

## API Contract

Question generation follows the "Match Drug to Class" recipe from `frontend-api-contract.md`:

1. `GET /v1/drugs/classes?type=epc&limit=4&page={random}` — pick 4 EPC classes
2. For each class: `GET /v1/drugs/classes/drugs?class={name}&limit=1` — get one drug from each class

**Retry logic:** If a class returns empty `data: []` (no drugs), skip that class and fetch another. Need exactly 4 valid class-drug pairs.

## Edge Cases

- A class has no drugs — skip, fetch replacement class
- Two drugs happen to share a class — ensure 4 distinct classes are selected
- API errors mid-generation — show partial error, offer retry
- Long drug or class names — text truncation or wrapping strategy
- Drug names normalized to Title Case for display consistency
- Obscure/non-exam drugs are filtered out (names >60 chars, containing commas, or homeopathic indicators)
- Long drug/class names truncated to 2 lines with hover tooltip showing full text
- Accessibility — keyboard navigation for matching (tab between columns, enter to select)

## Screenshot Checkpoints

1. Unmatched state — 4 drugs and 4 classes, no connections
2. Partially matched — 2 pairs connected, 2 remaining
3. All matched — ready to submit
4. Results — correct pairs green, incorrect red
5. Mobile viewport — stacked or side-by-side layout
