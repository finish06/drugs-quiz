# Rx Drill

A quiz app for pharmacy professionals to master drug names, brand/generic pairs, and pharmacological classes. Powered by real FDA/DailyMed data via the [drug-gate API](https://github.com/finish06/drug-gate).

**Current version:** v0.5.10 | **Maturity:** Beta | **339 tests** | **[rxdrill.com](https://rxdrill.com)**

## Features

### Quiz Types
- **Name the Class** — Multiple-choice: identify a drug's pharmacological class
- **Match Drug to Class** — Two-column matching: pair drugs with their classes
- **Brand/Generic Match** — Two-column matching: pair generic names with brand names
- **Quick 5** — Five random mixed-type questions for a fast study session
- **Timed Mode** — Countdown timer (30/60/90s) per question across all quiz types

### Study Tools
- **Spaced Repetition** — Tracks per-drug accuracy, surfaces weak drugs (<60%) for flashcard drills
- **Session History** — Last 10 sessions with personal best tracking per quiz type
- **Answer Review** — Correct answers with drug class context after each quiz
- **Question Flagging** — Bookmark questions for later review

### Accounts & Social
- **Google Sign-In** — Optional account for cloud features
- **Cloud Session Sync** — Migrate localStorage history to your account on first login
- **Shareable Score Cards** — Generate public share links with OG meta tags for social previews
- **Keyboard Shortcuts** — Navigate quizzes with keyboard (1-4 for answers, Enter to continue)

### Platform
- **What's New** — In-app changelog with notification dot for new updates
- **Dark Mode** — Automatic OS preference detection with manual toggle
- **Responsive** — Works on desktop and mobile browsers
- **Automated Deploys** — CI/CD with staging webhook and smoke tests

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose (for full stack)

### Local Development (Vite dev server)

```bash
cp .env.example .env
# Edit .env with your drug-gate API key and OAuth credentials
npm install
npm run dev
```

Open http://localhost:5173

### Full Stack (Docker Compose)

```bash
cp .env.example .env
# Edit .env — set APP_URL=http://localhost:8080 for Docker
docker compose up --build
```

Open http://localhost:8080

### Environment Variables

See `.env.example` for all variables. No URLs are hardcoded — all are config-driven.

| Variable | Purpose | When |
|----------|---------|------|
| `VITE_APP_URL` | Public URL for SEO, share text, robots/sitemap | Build-time |
| `APP_URL` | OAuth redirects and share page links | Runtime (BFF) |
| `DRUG_GATE_URL` | Upstream drug-gate API URL | Runtime (BFF) |
| `DRUG_GATE_API_KEY` | API key for drug-gate | Runtime (BFF) |
| `DATABASE_URL` | PostgreSQL connection string | Runtime (BFF) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Runtime (BFF) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Runtime (BFF) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Runtime (BFF) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| BFF Proxy | Hono |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | Google OAuth 2.0 (arctic) + JWT (jose) |
| Testing | Vitest + React Testing Library + Playwright |
| Containers | Docker + docker-compose |
| Hosting | GCP Compute Engine (e2-micro) |
| CI/CD | GitHub Actions → staging (webhook) + production (IAP tunnel) |

## Architecture

```
Browser → Cloudflare (TLS) → nginx (:80)
  ├─ Static assets (React SPA)
  ├─ /api/* → Hono BFF (:3001)
  │    ├─ /api/v1/*       → drug-gate API (X-API-Key injection)
  │    ├─ /api/auth/*     → Google OAuth + JWT sessions
  │    └─ /api/sessions/* → Session CRUD + migration
  ├─ /s/:token → Hono BFF (server-rendered share pages with OG tags)
  └─ PostgreSQL (users, quiz_sessions)
```

Auth is **additive** — the app works fully without an account. Sign-in unlocks cloud session sync and shareable score links.

### Deployment

| Environment | URL | Deploy Trigger | Infrastructure |
|-------------|-----|----------------|----------------|
| Local | http://localhost:5173 | Manual | Vite dev server |
| Staging | drug-quiz.staging.calebdunn.tech | Push to main | Homelab VM via deploy-hook webhook |
| Production | rxdrill.com | Version tag (v*) | GCP e2-micro via IAP tunnel |

## Scripts

```bash
npm run dev              # Vite dev server
npm run build            # Production build (generates changelog + SEO files, then tsc + vite)
npm run generate:changelog  # Parse CHANGELOG.md → src/generated/changelog.ts
npm run generate:seo     # Generate robots.txt + sitemap.xml from VITE_APP_URL
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run lint             # ESLint
npm run typecheck        # TypeScript check
```

## Project Structure

```
src/                 # React frontend
  components/        #   UI components (QuizConfig, MultipleChoice, MatchingQuiz, QuizResults, etc.)
  hooks/             #   Custom hooks (useQuizSession, useSessionHistory, useDrugPerformance, useAuth)
  contexts/          #   React contexts (AuthContext)
  services/          #   API client, quiz generators
  types/             #   TypeScript type definitions
scripts/             # Build-time generation (changelog parser, SEO files)
bff/                 # Hono BFF proxy + auth + database
  src/auth/          #   Google OAuth, JWT, middleware
  src/routes/        #   Session CRUD, share page routes
  src/db/            #   Drizzle ORM schema, migrations
  drizzle/           #   Versioned SQL migration files
deploy-hook/         # Staging deploy webhook (FastAPI)
tests/e2e/           # Playwright E2E tests
specs/               # Feature specifications (26 specs)
docs/                # PRD, plans, milestones, sequence diagrams
```

## Roadmap

| Milestone | Status | Version |
|-----------|--------|---------|
| M1: MVP Quiz — 3 quiz types + scoring | Done | v0.1.0 |
| M2: SEO & Discoverability | Done | v0.2.0 |
| M3: Learning Loop — answer review, spaced repetition, history, Quick 5 | Done | v0.3.0 |
| M4: Infrastructure — BFF proxy, automated staging, E2E, batched prefetch | Done | v0.4.0 |
| M5: Go Social — Google OAuth, cloud sync, shareable scores | Done | v0.5.0 |
| Production Launch — GCP deploy, config-driven URLs, What's New panel | Done | v0.5.1 |
| M6: Compete + Go Native — exam countdown, leaderboards, PWA, iOS app | Next | — |

## License

Private
