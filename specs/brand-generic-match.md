# Feature Spec: Brand/Generic Match Quiz

**Status:** Complete
**Milestone:** M1 — MVP Quiz
**PRD Reference:** docs/prd.md §7 Feature 3

## Description

A matching quiz where 4 generic drug names are presented on the left and 4 brand names on the right (both shuffled). The user connects each generic name to its brand name equivalent. This tests brand/generic equivalence knowledge critical for pharmacy practice.

## User Story

As a pharmacy student, I want to match generic drug names to their brand name equivalents so that I can memorize the brand/generic pairs that appear on licensing exams.

## Acceptance Criteria

1. **Layout:** Two columns — generic names on the left, brand names on the right, both shuffled
2. **Interaction:** Same tap-to-pair interaction as Match Drug to Class
3. **Visual pairing:** Matched pairs are visually connected
4. **Undo:** User can tap a matched pair to undo it
5. **Submit:** "Check Answers" button enabled when all 4 pairs are matched
6. **Feedback:** After submission, correct pairs green, incorrect red with correct answers shown
7. **Scoring:** Number of correct matches out of 4
8. **Drug selection:** Uses drugs from popular/exam-relevant classes to maximize study value

## User Test Cases

1. User sees 4 generic names (e.g., "atorvastatin") and 4 brand names (e.g., "Lipitor")
2. User matches all 4 pairs correctly — all green on submission
3. User gets 2 wrong — those pairs show red with correct brand names
4. On the next question, a different set of drugs appears

## Data Model

```typescript
interface MatchingQuestion {
  kind: "matching";
  leftItems: string[];    // 4 generic names, shuffled
  rightItems: string[];   // 4 brand names, shuffled
  correctPairs: Record<string, string>;  // generic -> brand mapping
}
```

## API Contract

Question generation follows the "Brand/Generic Match" recipe from `frontend-api-contract.md`:

1. `GET /v1/drugs/classes/drugs?class={popular_class}&limit=20` — get drugs from a popular EPC class
2. Filter for drugs that have a non-empty `brand_name`
3. Pick 4 drugs with both generic and brand names

**Popular classes to seed from** (exam-relevant):
- HMG-CoA Reductase Inhibitor
- ACE Inhibitor
- Proton Pump Inhibitor
- Beta Adrenergic Blocker
- Angiotensin 2 Receptor Blocker
- Selective Serotonin Reuptake Inhibitor
- Calcium Channel Blocker
- Benzodiazepine
- Thiazide Diuretic
- Opioid Agonist

**Retry logic:** If a class doesn't have 4 drugs with brand names, try a different class.

## Edge Cases

- Drug has no brand name (empty string) — filter out before selection
- Fewer than 4 drugs with brand names in a class — try a different class
- Brand name appears for multiple generics (unlikely but possible) — ensure unique pairs
- Drug and brand names normalized to Title Case for display consistency
- Obscure/non-exam drugs are filtered out (names >60 chars, containing commas, or homeopathic indicators)
- Long names truncated to 2 lines with hover tooltip showing full text
- Very long brand names — text wrapping

## Screenshot Checkpoints

1. Unmatched state — 4 generic and 4 brand names
2. All matched, pre-submission
3. Results — correct/incorrect feedback
4. Mobile viewport
