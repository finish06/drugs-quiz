# Spec: Batched Pre-fetching

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M4 (Infrastructure + Quality Hardening)
**Status:** Complete

## 1. Overview

Batch quiz generation API calls using `Promise.allSettled` to parallelize drug fetching. Currently, quiz generators make sequential API calls per question (O(n) serial). Batched pre-fetching reduces this to O(1) parallel batches, cutting quiz generation latency significantly.

### User Story

As a pharmacy student, I want quizzes to load fast so I don't lose motivation waiting for questions to generate.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | `fetchEpcClassPool` fetches both random pages in parallel using `Promise.allSettled` | Must |
| AC-002 | Question generators pre-fetch drug data for multiple classes in parallel batches instead of sequential loops | Must |
| AC-003 | `usedDrugs` deduplication is preserved — no duplicate drugs across questions in a session | Must |
| AC-004 | Failed fetches in a batch are handled gracefully — use successful results, skip failures | Must |
| AC-005 | A blocking performance test asserts that generating 5 questions with mocked API calls completes under a time budget | Must |
| AC-006 | All existing quiz generator tests pass without modification (no regression) | Must |
| AC-007 | The lazy-load mechanism (first 2 questions, then background) continues to work | Must |
| AC-008 | Quick 5 mixed-type generation benefits from batching | Must |

## 3. User Test Cases

### TC-001: Quiz loads faster
**Precondition:** BFF proxy configured
**Steps:**
1. Start a 10-question Name the Class quiz
2. Observe loading time
**Expected Result:** Questions load noticeably faster than sequential. First 2 questions appear quickly, remaining load in background.

### TC-002: No duplicate drugs
**Steps:**
1. Complete a 10-question quiz
2. Check all drug names
**Expected Result:** No drug appears in more than one question.

## 4. Technical Design

### Current (Sequential)
```
for each question:
  for each class in shuffled pool:
    await getDrugsInClass(class)  // serial — waits for each response
    if found valid drug → break
```

### Proposed (Batched)
```
// Pre-fetch drugs for N candidate classes in parallel
const candidates = shuffledClasses.slice(0, batchSize)
const results = await Promise.allSettled(
  candidates.map(cls => getDrugsInClass({ class: cls.name, limit: 5 }))
)

// Process results, extract valid drugs
// If not enough, fetch another batch
```

### Batch Size

- **Name the Class:** Batch 8 classes → pick 1 drug from results
- **Match Drug to Class:** Batch 12 classes → pick 4 drugs from results
- **Brand/Generic Match:** Batch 12 classes → pick 4 drugs with brand names from results
- Over-fetch to account for failures and filtering (exam-relevance, deduplication)

### usedDrugs Deduplication

The `usedDrugs` Set is passed between question generations. With batching:
1. Pre-fetch a pool of candidate drugs (parallel)
2. Filter candidates against `usedDrugs` (sequential — must be deterministic)
3. Select drugs from filtered pool
4. Add selected to `usedDrugs`

This preserves deduplication while allowing parallel fetching.

## 5. Performance Test

```typescript
it("AC-005: generates 5 questions under time budget", async () => {
  // Mock API to simulate realistic latency
  mockGenerators.getDrugsInClass.mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve(mockData), 10))
  );

  const start = performance.now();
  const questions = await generateQuestions("name-the-class", 5);
  const duration = performance.now() - start;

  expect(questions).toHaveLength(5);
  // With 10ms mock latency, sequential = 5*10*N = 500ms+
  // Batched should be ~10ms per batch * few batches = <100ms
  expect(duration).toBeLessThan(200); // generous budget for CI
});
```

## 6. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| All classes in a batch fail | Fetch another batch from the pool. If 3 batches fail, throw error. |
| Not enough valid drugs from batch | Fetch another batch with remaining classes |
| usedDrugs filters out all candidates | Move to next batch, broader class pool |
| API returns empty drug list for class | Skip that class, use other batch results |
| Promise.allSettled returns mix of fulfilled/rejected | Use fulfilled results, ignore rejected |

## 7. Dependencies

- `src/services/quiz-generators.ts` — main implementation target
- `src/services/api-client.ts` — API functions called in batches
- BFF proxy (AC depends on proxy being in place for production latency gains)

## 8. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from cycle 5 interview |
