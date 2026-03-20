# Final 4-Milestone Roadmap — drugs-quiz
## Presented to CEO for Approval

**Synthesized from:** UX/Product Lead, Technical Architect, Growth Strategist
**Date:** 2026-03-19

---

## Executive Summary

Three independent perspectives converged on the same core insight: **the product works, but users have no reason to come back.** The quiz engine is solid. What's missing is the learning loop, habit mechanics, and distribution channels that turn a one-time visit into a daily study tool.

All three agents agreed on sequencing: **retention before acquisition, infrastructure before features, free value before monetization.**

---

## Consensus Themes (What All 3 Agents Agreed On)

| Theme | UX Agent | Tech Agent | Growth Agent |
|-------|----------|------------|--------------|
| Spaced repetition is the #1 feature | Yes (Idea #2) | Yes (localStorage cache) | Yes (Idea #2) |
| localStorage before accounts | Yes (M3/M4 local-first) | Yes (persistent cache) | Yes (anonymous SR) |
| BFF proxy needed before auth | — | Yes (Milestone A) | — |
| Shareable score cards for distribution | Yes (Idea #10) | — | Yes (Idea #1) |
| PWA install is high-leverage | Yes (M6) | — | Yes (Milestone A) |
| Error boundaries / quality hardening | — | Yes (Milestone B) | — |
| Exam countdown mode drives urgency | Yes (Idea #3) | — | Yes (Idea #3) |

---

## The Final 4-Milestone Roadmap

### M3: Close the Learning Loop + Retention Foundation
**Goal:** Transform the quiz from a test into a study tool. Give users a reason to come back tomorrow.
**Appetite:** 2-3 weeks
**Target:** Daily active usage, 30%+ 7-day return rate

| Feature | Source | Why |
|---------|--------|-----|
| **Answer Review Mode** | UX Agent #1 | Show correct answers + drug class context after each quiz. Table stakes for learning. |
| **Spaced Repetition (localStorage)** | All 3 agents | Track weak drugs, surface them more often. Highest-leverage retention feature. No backend needed. |
| **Session History + Personal Best (localStorage)** | UX Agent #8 | Last 10 sessions on home screen. Creates trajectory awareness. Primes account migration later. |
| **"Quick 5" Entry Point** | UX Agent #6 | One-tap 5-question mix. Lowers activation energy for short sessions. |

**Why M3 first:** All three agents agreed — fix retention before driving traffic. A user who learns *why* they got something wrong and sees their weak spots improve over time will come back. A user who just sees "70%" won't.

---

### M4: Infrastructure + Quality Hardening
**Goal:** Build the technical foundation for user accounts and social features. Make the existing product bulletproof.
**Appetite:** 2 weeks
**Target:** Automated staging deploys, full E2E coverage, sub-1s quiz load on warm cache

| Feature | Source | Why |
|---------|--------|-----|
| **BFF Proxy Service** | Tech Agent #5 | Lightweight Node/Hono container. Moves API key server-side. Required surface for OAuth in M5. |
| **Automated Staging Deploy** | Tech Agent #7 | CI pushes to staging and runs smoke tests on every merge. Eliminates manual deploy tax. |
| **Full E2E Test Coverage** | Tech Agent #6 | Complete quiz flow tests for all 3 types + error states. Screenshot capture in CI. Required before shipping auth. |
| **Performance: Batched Pre-fetching** | Tech Agent #4 | Batch API calls with `Promise.allSettled`. Cut quiz generation from O(n sequential) to O(1 batch). |

**Why M4 second:** The Tech Agent made the strongest case here — you cannot safely bolt auth onto an infrastructure gap. The BFF is the foundation M5 needs. E2E coverage catches auth state machine bugs before users do. Batch pre-fetching makes the product fast enough for the longer sessions that spaced repetition (M3) will drive.

---

### M5: Go Social — Accounts + Viral Distribution
**Goal:** Add Google OAuth accounts, shareable results, and the viral distribution loop. Convert localStorage users to cloud-synced accounts.
**Appetite:** 3-4 weeks
**Target:** 20%+ account signup rate, 1,000 organic MAU within 60 days

| Feature | Source | Why |
|---------|--------|-----|
| **Google OAuth + User Accounts** | PRD M3, Tech Agent | OAuth via BFF, JWT sessions. "Sync your localStorage history to the cloud" upgrade path. |
| **Shareable Score Cards** | UX Agent #10, Growth Agent #1 | Auto-generated result card with share to Reddit/Twitter/iMessage. Every session becomes a distribution event. |
| **Instructor Share Links** | Growth Agent #4 | Pre-configured quiz URLs for specific drug classes. B2B2C wedge — one professor = 120 students. |
| **Semantic Release (v1.0.0)** | Tech Agent #8 | Ship the first public release with changelog. Signals maturity to instructors and institutions. |

**Why M5 third:** The Growth Agent's sequencing logic is sound — you need retention (M3) and a real user base before social features have meaning. The UX Agent's "localStorage before accounts" strategy means account signup is a natural upgrade, not a cold-start onboarding wall.

---

### M6: Compete + Go Native
**Goal:** Add the competitive layer and native experience that makes drugs-quiz the default pharmacy study tool.
**Appetite:** 3-4 weeks
**Target:** School leaderboard adoption, PWA installs, exam mode completion >60%

| Feature | Source | Why |
|---------|--------|-----|
| **Exam Countdown Mode** | UX Agent #3, Growth Agent #3 | NAPLEX/PTCE simulation with daily quota and timer. The word-of-mouth feature for faculty recommendations. |
| **School-Affiliated Leaderboards** | Growth Agent #6 | Peer-group competition drives cohort engagement. Students recruit classmates to climb rankings. |
| **PWA + Offline Support** | UX Agent, Growth Agent | Installable from browser. Offline quiz with cached data. Push notifications for streak reminders. |

**Why M6 last:** Leaderboards need a user base (from M5's viral loop) to avoid being a ghost town. PWA installation is the final step in making the app feel native.

**Monetization (Backlog):** Pro tier moved to backlog per CEO decision. The product stays free to maximize word-of-mouth adoption in the pharmacy student community. Revisit monetization when MAU justifies it.

---

## What We're NOT Doing (Deliberate Cuts)

| Cut | Why |
|-----|-----|
| Drug pronunciation guide | Nice but not retention-critical. Revisit post-M6. |
| Bundle size budget in CI | Good practice but won't block any near-term milestone. Add during M4 as a bonus. |
| TypeScript `noUncheckedIndexedAccess` | Already have 95% coverage. Diminishing returns vs. feature velocity. |
| Community seeding (Reddit/Discord) | Ops play, not engineering. Do it organically alongside M5 launch. |
| Referral program | Premature before proving Pro conversion. Revisit in M7. |

---

## Timeline Overview

```
M3: Learning Loop (2-3 weeks)  ──→  M4: Infrastructure (2 weeks)  ──→  M5: Go Social (3-4 weeks)  ──→  M6: Compete + Monetize (3-4 weeks)
     localStorage-first                  BFF + E2E + perf                  Accounts + viral                  Leaderboards + Pro
     retention focus                     foundation focus                  acquisition focus                 monetization focus
```

**Total estimated timeline: 10-13 weeks** (Alpha → Beta maturity)

---

## Approval Request

This roadmap advances drugs-quiz from a working MVP to a competitive, monetizable pharmacy exam prep platform. The sequencing is designed to prove value at each stage before investing in the next.

**Requesting CEO approval to begin M3: Close the Learning Loop.**
