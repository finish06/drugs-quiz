# Rx Drill — Product Requirements Document

**Version:** 0.5.0
**Created:** 2026-03-15
**Author:** Caleb Dunn
**Status:** Active
**Production:** https://rxdrill.com

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

### Out of Scope (Current Phase)

- Native iOS app (Capacitor wrap — future milestone)
- Drug pronunciation guide — revisit post-M6
- Monetization / Pro tier — backlog, revisit when MAU justifies it
- Referral program — premature before proving conversion, revisit M7+
- Community seeding (Reddit/Discord) — ops play, not engineering

## 5. Architecture

### Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | TypeScript | 5.x | Frontend + BFF |
| Frontend | React | 19 | SPA with Vite bundler |
| BFF Proxy | Hono | latest | API key injection, auth, session routes, share pages |
| ORM | Drizzle ORM | latest | PostgreSQL schema, migrations |
| Database | PostgreSQL | 16 | Users, quiz sessions, share tokens |
| Auth | Google OAuth 2.0 (arctic) + JWT (jose) | latest | httpOnly cookies, 30-day expiry |
| Native (future) | Capacitor | — | iOS wrap when ready |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Testing | Vitest + RTL | — | Unit and component tests (339 tests) |
| E2E Testing | Playwright | — | End-to-end browser tests |
| API | drug-gate | v0.4.0 | External REST API (see frontend-api-contract.md) |

### Infrastructure

| Component | Choice | Notes |
|-----------|--------|-------|
| Git Host | GitHub | — |
| Cloud Provider | GCP | Compute Engine e2-micro (free tier) |
| CI/CD | GitHub Actions | Lint, test, build, push images, deploy via IAP tunnel |
| Containers | Docker + docker-compose | All environments |
| TLS | Cloudflare | Free proxy for HTTPS |
| Deploy (staging) | deploy-hook webhook | HMAC-signed, smoke tests |
| Deploy (production) | gcloud SSH via IAP | Triggered on version tags, approval gate |

### Environment Strategy

| Environment | Purpose | URL | Deploy Trigger | Infrastructure |
|-------------|---------|-----|----------------|----------------|
| Local | Development & unit tests | http://localhost:5173 | Manual | Docker Compose on dev machine |
| Staging | Integration testing | https://drug-quiz.staging.calebdunn.tech | Push to staging branch | Dedicated VM on homelab |
| Production | Live users | https://rxdrill.com | Version tag (v*) | GCP Compute Engine (e2-micro), deploy via IAP tunnel |

**Environment Tier:** 3 (full pipeline: dev → staging → production)

SSH access: staging via direct SSH, production via GCP IAP tunnel. No URLs are hardcoded — all are config-driven via `VITE_APP_URL` (build-time) and `APP_URL` (runtime).

## 6. Milestones & Roadmap

### Current Maturity: Beta

### Roadmap

| Milestone | Goal | Target Maturity | Status | Success Criteria |
|-----------|------|-----------------|--------|------------------|
| M1: MVP Quiz | Core quiz experience with 3 quiz types and scoring | Alpha | DONE | All 3 quiz types work, scoring displays, responsive UI |
| M2: SEO & Discoverability | Organic search discovery and social sharing | Alpha | DONE | OG tags, structured data, sitemap, robots.txt, keyword-optimized meta |
| M3: Close the Learning Loop | Transform quiz into a study tool — answer review, spaced repetition, session history, Quick 5 | Alpha | DONE | Daily active usage, 30%+ 7-day return rate, users learn from mistakes |
| M4: Infrastructure + Quality Hardening | BFF proxy, automated staging deploy, full E2E, batched pre-fetching | Beta | DONE | Automated staging deploys, full E2E coverage, sub-1s quiz load on warm cache |
| M5: Go Social — Accounts + Viral Distribution | Google OAuth, shareable score cards, v0.5.0 | Beta | DONE | 20%+ account signup rate, 1K organic MAU within 60 days |
| M6: Compete + Go Native | Exam countdown, school leaderboards, PWA + offline, Capacitor iOS, v1.0.0 | Beta | NEXT | App Store listing, school leaderboard adoption, PWA installs, exam mode completion >60% |
| M7: Study Experience | Progress dashboard, badges, custom quiz, NAPLEX mode, polish | Beta | NOW | Daily active users, study session depth, exam mode adoption |
| Backlog: Monetization | Pro tier, advanced analytics, referral program | — | LATER | Free-first strategy — revisit when MAU justifies it |

### Milestone Detail

#### M1: MVP Quiz [DONE]
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
- [x] All 3 quiz types generate questions from the API
- [x] Scoring displays correctly at end of session
- [x] UI is responsive and usable on mobile
- [x] 90% test coverage
- [x] E2E tests pass for all quiz flows

#### M2: SEO & Discoverability [DONE]
**Goal:** Optimize for organic search discovery and social sharing.

**Appetite:** 1 week

**Target maturity:** Alpha

**Features:**
- OG tags and social sharing meta
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Keyword-optimized meta descriptions

#### M3: Close the Learning Loop [DONE]
**Goal:** Transform the quiz from a test into a study tool. Give users a reason to come back tomorrow.

**Appetite:** 2-3 weeks

**Target maturity:** Alpha

**Features:**
- **Answer Review Mode** — Show correct answers + drug class context after each quiz. Table stakes for learning.
- **Spaced Repetition (localStorage)** — Track weak drugs, surface them more often. Highest-leverage retention feature. No backend needed.
- **Session History + Personal Best (localStorage)** — Last 10 sessions on home screen. Creates trajectory awareness. Primes account migration later.
- **"Quick 5" Entry Point** — One-tap 5-question mix. Lowers activation energy for short sessions.

**Success criteria:**
- [x] Answer review shows correct answers with drug class context after each quiz
- [x] Spaced repetition surfaces weak drugs more frequently
- [x] Session history displays last 10 sessions on home screen
- [x] Personal best tracking motivates improvement
- [x] Quick 5 launches a 5-question mixed quiz in one tap
- [x] All data persists in localStorage (no backend required)
- [ ] 30%+ 7-day return rate (measuring)

#### M4: Infrastructure + Quality Hardening [DONE]
**Goal:** Build the technical foundation for user accounts and social features. Make the existing product bulletproof.

**Appetite:** 2 weeks

**Target maturity:** Alpha

**Features:**
- **BFF Proxy Service** — Lightweight Node/Hono container. Moves API key server-side. Required surface for OAuth in M5.
- **Automated Staging Deploy** — CI pushes to staging and runs smoke tests on every merge. Eliminates manual deploy tax.
- **Full E2E Test Coverage** — Complete quiz flow tests for all 3 types + error states. Screenshot capture in CI.
- **Performance: Batched Pre-fetching** — Batch API calls with `Promise.allSettled`. Cut quiz generation from O(n sequential) to O(1 batch).

**Success criteria:**
- [x] BFF proxy handles all API calls, API key never exposed to client
- [x] Staging deploys automatically on merge with smoke tests
- [x] Full E2E coverage for all quiz flows and error states
- [x] Quiz generation uses batched pre-fetching, sub-1s load on warm cache

#### M5: Go Social — Accounts + Viral Distribution [DONE]
**Goal:** Add Google OAuth accounts, shareable results, and the viral distribution loop. Convert localStorage users to cloud-synced accounts.

**Appetite:** 2 weeks

**Target maturity:** Beta

**Features:**
- **Google OAuth + User Accounts** — OAuth via BFF, JWT sessions. ✅ (PR #8)
- **Database Schema + ORM** — Drizzle ORM with Postgres, users + quiz_sessions tables. ✅ (PR #8)
- **Shareable Score Cards** — Public share pages with OG meta tags for social previews. ✅ (PR #9)
- **localStorage Migration** — Migration modal on first login syncs history to cloud. ✅ (PR #9)

**Scope changes from PRD v0.2.0:**
- Instructor share links punted to backlog
- v1.0.0 deferred to App Store availability (M6); tagged v0.5.0 instead
- OG images deferred — using HTML meta tags only for now

**Success criteria:**
- [x] Google OAuth login via BFF
- [x] Database schema with users + quiz_sessions via ORM
- [x] localStorage data migrates to cloud on account creation
- [x] Shareable score cards generate and display correctly
- [x] v0.5.0 tagged and released
- [ ] 20%+ account signup rate (measuring)
- [ ] 1,000 organic MAU within 60 days (measuring)

#### M7: Study Experience [NOW]
**Goal:** Turn Rx Drill from a quiz app into a focused study tool. Help users see progress, celebrate wins, and control what they study.

**Appetite:** 2 weeks

**Target maturity:** Beta

**Features:**
- **Progress Dashboard** — Personal analytics: accuracy trends, weak drug classes, time-per-question, streak count
- **Achievement Badges** — First 100%, 7-day streak, class mastery, 100 questions answered
- **Custom Quiz** — Pick specific drug classes to study (multi-select UI)
- **NAPLEX/PTCE Mode** — Quiz generator weighted by exam blueprint percentages
- **Confetti + Polish** — Celebration animation, keyboard hint overlay, share page dark mode verify
- **Ops** — `workflow_dispatch` for manual releases, scheduled E2E smoke tests against production

**Cycle plan:** 4 cycles (12-15). See `docs/milestones/M7-study-experience.md`.

**Success criteria:**
- [ ] Progress dashboard shows accuracy trends and weak areas
- [ ] At least 5 achievement badges implemented
- [ ] Custom quiz lets users select specific drug classes
- [ ] NAPLEX mode weighted by exam blueprint
- [ ] Daily E2E smoke tests running against production
- [ ] Test coverage remains ≥ 78% branches

#### M6: Compete + Go Native [NEXT]
**Goal:** Add the competitive layer and native iOS experience that makes drugs-quiz the default pharmacy study tool. Ship v1.0.0 to the App Store.

**Appetite:** 3-4 weeks

**Target maturity:** Beta

**Features:**
- **Capacitor iOS App** — Wrap React SPA in native shell, OAuth deep links, haptic feedback, native share sheet, App Store submission. The v1.0.0 gate.
- **PWA + Offline Support** — Installable from browser. Offline quiz with cached data. Push notifications for streak reminders.
- **Exam Countdown Mode** — NAPLEX/PTCE simulation with daily quota and timer. The word-of-mouth feature for faculty recommendations.
- **School-Affiliated Leaderboards** — Peer-group competition drives cohort engagement. Students recruit classmates to climb rankings.

**Success criteria:**
- [ ] iOS app on App Store (or TestFlight)
- [ ] v1.0.0 tagged after App Store approval
- [ ] Exam countdown mode with daily quota and timer
- [ ] School-affiliated leaderboards functional
- [ ] PWA installable with offline quiz support
- [ ] Exam mode completion rate >60%

### Timeline Overview

```
M3: Learning Loop (2-3 wks) → M4: Infrastructure (2 wks) → M5: Go Social (3-4 wks) → M6: Compete + Native (3-4 wks)
     localStorage-first              BFF + E2E + perf             Accounts + viral              Leaderboards + PWA
     retention focus                 foundation focus             acquisition focus              competition focus
```

**Total estimated timeline: 10-13 weeks** (Alpha → Beta maturity)

### Strategic Sequencing

**Retention before acquisition.** Fix the learning loop before driving traffic — a user who learns *why* they got something wrong will come back; a user who just sees "70%" won't.

**Infrastructure before features.** The BFF proxy is the foundation M5 needs. E2E coverage catches auth state machine bugs before users do.

**Free value before monetization.** Product stays free to maximize word-of-mouth adoption in the pharmacy student community. Monetization revisited when MAU justifies it.

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

### Feature 6: Timed Quiz Mode
Optional countdown timer (30/60/90 seconds) per question across all quiz types.

### Feature 7: Google Sign-In + Cloud Sync
Optional Google OAuth account. Quiz sessions sync to cloud. localStorage migration on first login.

### Feature 8: Shareable Score Cards
Authenticated users generate public share links with OG meta tags for social previews.

### Feature 9: What's New Panel
In-app changelog notification with version tracking. Build-time CHANGELOG.md parser generates customer-facing entries.

## 8. Non-Functional Requirements

- **Performance:** Quiz questions should load within 1 second. API responses are cached server-side (60-min TTL), so most requests will be fast (~5-20ms).
- **Security:** API key never exposed to client (BFF proxy). OAuth via PKCE + CSRF. JWT in httpOnly cookies. No hardcoded secrets or URLs in source.
- **Accessibility:** WCAG 2.1 AA compliance — keyboard navigable (1-4 shortcuts), screen reader friendly, sufficient color contrast.
- **Offline:** PWA service worker for basic offline support (cached quiz data) — M6.

### Deliberate Cuts

| Cut | Why |
|-----|-----|
| Drug pronunciation guide | Nice but not retention-critical. Revisit post-M6. |
| Bundle size budget in CI | Good practice but won't block near-term milestones. Add during M4 as a bonus. |
| TypeScript `noUncheckedIndexedAccess` | Already have 95% coverage. Diminishing returns vs. feature velocity. |
| Community seeding (Reddit/Discord) | Ops play, not engineering. Do organically alongside M5 launch. |
| Referral program | Premature before proving Pro conversion. Revisit in M7. |

## 9. Open Questions

- ~~How should the API key be handled for the frontend?~~ **Resolved:** Build-time env var for now; BFF proxy in M4.
- ~~What domain/URL for staging and production?~~ **Resolved:** staging: drug-quiz.staging.calebdunn.tech, prod: rxdrill.com
- ~~Should quiz sessions persist across page refreshes?~~ **Resolved:** Yes, localStorage-first strategy (M3). Cloud sync on account creation (M5).
- ~~Where to host production?~~ **Resolved:** GCP Compute Engine e2-micro (free tier), deploy via IAP tunnel on version tags.
- ~~How to handle URLs across environments?~~ **Resolved:** Config-driven via `VITE_APP_URL` (build-time) and `APP_URL` (runtime). No hardcoded URLs.

## 10. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-15 | 0.1.0 | Caleb Dunn | Initial draft from /add:init interview |
| 2026-03-20 | 0.2.0 | Caleb Dunn | Updated roadmap from final-roadmap.md — M1/M2 marked DONE, expanded M3-M6 detail, added strategic sequencing, resolved open questions, added deliberate cuts |
| 2026-03-29 | 0.3.0 | Caleb Dunn | M5 marked DONE (v0.5.0 tagged), M6 promoted to NOW, updated M5 success criteria and feature status |
| 2026-04-03 | 0.4.0 | Caleb Dunn | Rebrand to Rx Drill, production at rxdrill.com, GCP infrastructure (e2-micro + IAP), updated tech stack (Hono BFF, Drizzle ORM, Postgres, Google OAuth), config-driven URLs, all M3/M4 criteria checked, resolved hosting and URL questions |
| 2026-04-11 | 0.5.0 | Caleb Dunn | Added M7 Study Experience milestone (progress dashboard, badges, custom quiz, NAPLEX mode, polish, ops). M6 moved to NEXT, M7 promoted to NOW |
