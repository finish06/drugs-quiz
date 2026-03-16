# drugs-quiz — Product Requirements Document

**Version:** 0.1.0
**Created:** 2026-03-15
**Author:** Caleb Dunn
**Status:** Draft

## 1. Problem Statement

Pharmacy students, technicians, and professionals studying for licensing exams need to memorize hundreds of drug names, their brand/generic equivalents, and pharmacological classes. Current study methods (flashcards, textbooks) are passive and don't provide interactive, randomized quizzing with immediate feedback. This project provides an interactive quiz app powered by real FDA/DailyMed drug data via the drug-gate API.

## 2. Target Users

- **Primary:** Pharmacy students studying for professional licensing exams (NAPLEX, PTCE)
- **Secondary:** Practicing pharmacists and technicians refreshing their knowledge
- **Tertiary:** Pharmacy instructors looking for study tools for students

## 3. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quiz session completion rate | >70% of started sessions completed | Track sessions started vs. completed |
| Questions answered per session | >10 questions per session | Average questions per completed session |
| Return usage | Users return within 7 days | Session tracking (milestone 3+) |

## 4. Scope

### In Scope (MVP — Milestone 1)

- Three quiz types from the API contract:
  - **Match Drug to Class** — drag/tap to match 4 drugs to 4 classes
  - **Name the Class** — multiple choice: given a drug, select its pharmacological class
  - **Brand/Generic Match** — match generic names to brand names
- Basic scoring within a session (correct/incorrect count, percentage)
- Quiz configuration (number of questions, quiz type selection)
- Responsive web UI (works on mobile browsers via PWA)
- API key management via environment variable

### Out of Scope

- **Milestone 2:** User accounts and authentication
- **Milestone 3:** Progress tracking and historical performance
- **Milestone 4:** Leaderboards and social features
- Native iOS app (Capacitor wrap — future milestone)

## 5. Architecture

### Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | TypeScript | 5.x | Frontend only |
| Frontend | React | 19 | SPA with Vite bundler |
| Native (future) | Capacitor | — | iOS wrap when ready |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Testing | Vitest + RTL | — | Unit and component tests |
| E2E Testing | Playwright | — | End-to-end browser tests |
| API | drug-gate | v0.4.0 | External REST API (see frontend-api-contract.md) |

### Infrastructure

| Component | Choice | Notes |
|-----------|--------|-------|
| Git Host | GitHub | — |
| Cloud Provider | AWS | EC2 for production |
| CI/CD | GitHub Actions | Lint, test, build, deploy |
| Containers | Docker + docker-compose | All environments |
| IaC | None | Manual provisioning for now |

### Environment Strategy

| Environment | Purpose | URL | Deploy Trigger | Infrastructure |
|-------------|---------|-----|----------------|----------------|
| Local | Development & unit tests | http://localhost:5173 | Manual | Docker Compose on dev machine |
| Staging | Integration testing | https://drug-quiz.staging.calebdunn.tech | Push to staging branch | Dedicated VM on homelab |
| Production | Live users | https://drug-quiz.calebdunn.tech | Merge to main | AWS EC2 instance |

**Environment Tier:** 3 (full pipeline: dev → staging → production)

SSH key for staging access will be generated in the project directory for direct deployment and testing.

## 6. Milestones & Roadmap

### Current Maturity: Alpha

### Roadmap

| Milestone | Goal | Target Maturity | Status | Success Criteria |
|-----------|------|-----------------|--------|------------------|
| M1: MVP Quiz | Core quiz experience with 3 quiz types and scoring | Alpha | NOW | All 3 quiz types work, scoring displays, responsive UI |
| M2: User Accounts | Authentication and user profiles | Alpha | NEXT | Users can sign up, log in, and sessions are tied to accounts |
| M3: Progress Tracking | Historical performance and study analytics | Beta | LATER | Users see accuracy trends over time |
| M4: Leaderboards | Social features and competitive elements | Beta | LATER | Users can compare scores with peers |

### Milestone Detail

#### M1: MVP Quiz [NOW]
**Goal:** Deliver the core interactive quiz experience with all three quiz types, basic scoring, and a responsive UI that works well on mobile.
**Appetite:** 2-3 weeks
**Target maturity:** Alpha
**Features:**
- match-drug-to-class — 4-option matching quiz
- name-the-class — multiple choice quiz
- brand-generic-match — matching generic to brand names
- quiz-session — scoring, question navigation, results summary
- quiz-config — select quiz type, number of questions
**Success criteria:**
- [ ] All 3 quiz types generate questions from the API
- [ ] Scoring displays correctly at end of session
- [ ] UI is responsive and usable on mobile
- [ ] 90% test coverage
- [ ] E2E tests pass for all quiz flows

### Maturity Promotion Path

| From | To | Requirements |
|------|-----|-------------|
| Alpha → Beta | Feature specs for all user-facing features, test coverage above 50%, PR workflow, 2+ environments active, TDD evidence |
| Beta → GA | 80%+ coverage, all quality gates blocking, E2E required, release tags, branch protection, spec-driven evidence |

## 7. Key Features

### Feature 1: Match Drug to Class
Given 4 random EPC drug classes, fetch one drug from each class. Present shuffled drug names on the left and class names on the right. User matches them. Score based on correct matches.

### Feature 2: Name the Class
Pick a random generic drug, look up its EPC class, fetch 3 distractor classes. Present as multiple choice. User selects the correct class.

### Feature 3: Brand/Generic Match
Fetch drugs from a popular class that have both brand and generic names. Present shuffled generic names on the left and brand names on the right. User matches them.

### Feature 4: Quiz Session
Manages quiz flow: question generation, answer tracking, scoring (correct/incorrect/percentage), results summary at the end.

### Feature 5: Quiz Configuration
Home screen where users select quiz type, number of questions, and start a session.

## 8. Non-Functional Requirements

- **Performance:** Quiz questions should load within 1 second. API responses are cached server-side (60-min TTL), so most requests will be fast (~5-20ms).
- **Security:** API key stored as environment variable, never exposed to client. Use a backend proxy or build-time injection pattern if needed.
- **Accessibility:** WCAG 2.1 AA compliance — keyboard navigable, screen reader friendly, sufficient color contrast.
- **Offline:** PWA service worker for basic offline support (cached quiz data).

## 9. Open Questions

- How should the API key be handled for the frontend? Options: build-time env var (Vite), lightweight proxy, or serverless function.
- What domain/URL for staging and production?
- Should quiz sessions persist across page refreshes (localStorage)?

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-15 | 0.1.0 | Caleb Dunn | Initial draft from /add:init interview |
