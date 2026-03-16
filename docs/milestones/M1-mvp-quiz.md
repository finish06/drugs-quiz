# Milestone M1 — MVP Quiz

**Goal:** Deliver the core interactive quiz experience with all three quiz types, basic scoring, and a responsive UI that works well on mobile.
**Appetite:** 2-3 weeks
**Target Maturity:** Alpha
**Status:** IN_PROGRESS
**Started:** 2026-03-15

## Hill Chart

```
quiz-config          ████████████████████████████████████  DONE — implemented + tested
name-the-class       ████████████████████████████████████  DONE — implemented + tested + E2E verified
match-drug-to-class  ████████████████████████████████████  DONE — implemented + tested
brand-generic-match  ████████████████████████████████████  DONE — implemented + tested + E2E verified
quiz-session         ████████████████████████████████████  DONE — implemented + tested
ci-docker-registry   ████████████████████████████████████  DONE — beta push verified in registry
```

## Feature Details

| Feature | Spec | Position | Notes |
|---------|------|----------|-------|
| quiz-config | specs/quiz-config.md | DONE | Home screen, quiz type + count selection |
| name-the-class | specs/name-the-class.md | DONE | Multiple choice quiz, class-first generator |
| match-drug-to-class | specs/match-drug-to-class.md | DONE | Matching quiz with color-coded pairs |
| brand-generic-match | specs/brand-generic-match.md | DONE | Matching quiz, cross-class collection |
| quiz-session | specs/quiz-session.md | DONE | Session flow, scoring, results |
| ci-docker-registry | specs/ci-docker-registry.md | DONE | Beta push verified, release workflow ready |

## Success Criteria

- [x] All 3 quiz types generate questions from the API
- [x] Scoring displays correctly at end of session
- [x] UI is responsive and usable on mobile
- [x] 90% test coverage
- [x] E2E tests pass for quiz flows
- [x] CI pushes Docker images to registry
- [x] Deployed to staging (192.168.1.145:8080, beta-d608660)

## Cycle History

| Cycle | Features | Status | Notes |
|-------|----------|--------|-------|
| cycle-1 | ci-docker-registry (SPECCED→DONE) | COMPLETE | Beta push to dockerhub.calebdunn.tech verified, release workflow ready |
