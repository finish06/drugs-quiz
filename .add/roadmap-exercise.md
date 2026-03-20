# Roadmap Exercise — drugs-quiz

## Context
drugs-quiz is a React SPA that quizzes pharmacy professionals on drug names, brand/generic pairs, and pharmacological classes. Powered by the drug-gate API with real FDA/DailyMed data.

**Current state:**
- M1 (MVP Quiz) DONE: 3 quiz types, scoring, dark mode, lazy loading, responsive UI
- M2 (SEO) DONE: OG tags, structured data, sitemap, robots.txt
- Deployed to staging (192.168.1.145:8080), production URL pending
- 95% test coverage, CI/CD with GitHub Actions, Docker registry
- Tech: React 19, TypeScript, Vite, Tailwind CSS 4, Vitest, Playwright

**Existing backlog (from PRD):**
- M3: User Accounts (Google OAuth — architecture TBD)
- M4: Progress Tracking (historical performance/analytics)
- M5: Leaderboards (social/competitive features)
- M6: PWA & Native (offline, installable, Capacitor iOS)

**Target users:** Pharmacy students (NAPLEX/PTCE), practicing pharmacists, pharmacy instructors

## Exercise
Each agent proposes 10 improvements, then narrows to a 4-milestone roadmap.
Agents coordinate by writing to: /Users/calebdunn/Documents/Projects/drugs-quiz/.add/roadmap-proposals/
- agent-1-ux.md (UX/Product agent)
- agent-2-tech.md (Technical/Architecture agent)
- agent-3-growth.md (Growth/Market agent)
- final-roadmap.md (consensus output)

## Coordination Protocol
1. Each agent writes their proposal file
2. Each agent reads the other two proposals
3. Agents discuss via a shared discussion.md file (append-only)
4. Final ranked roadmap written to final-roadmap.md
