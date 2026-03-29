# Rx Quiz

A quiz app for pharmacy professionals to master drug names, brand/generic pairs, and pharmacological classes. Powered by real FDA/DailyMed data via the [drug-gate API](https://github.com/finish06/drug-gate).

**Current version:** v0.5.0 | **Maturity:** Beta | **339 tests**

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

See `.env.example` for all variables. Key ones:

| Variable | Purpose |
|----------|---------|
| `DRUG_GATE_URL` | Upstream drug-gate API URL |
| `DRUG_GATE_API_KEY` | API key for drug-gate |
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `APP_URL` | Application URL for OAuth redirects |

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

## Architecture

```
Browser (React SPA)
  → nginx (:8080, serves static + proxies /api/ and /s/)
    → Hono BFF (:3001)
      ├─ /api/v1/*    → drug-gate API (with X-API-Key injection)
      ├─ /api/auth/*  → Google OAuth + JWT sessions
      ├─ /api/sessions/* → Session CRUD + migration
      └─ /s/:token    → Server-rendered public share pages (OG meta tags)
    → PostgreSQL (users, quiz_sessions)
```

Auth is **additive** — the app works fully without an account. Sign-in unlocks cloud session sync and shareable score links.

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Project Structure

```
src/                 # React frontend
  components/        #   UI components (QuizConfig, MultipleChoice, MatchingQuiz, QuizResults, etc.)
  hooks/             #   Custom hooks (useQuizSession, useSessionHistory, useDrugPerformance, useAuth)
  contexts/          #   React contexts (AuthContext)
  services/          #   API client, quiz generators
  types/             #   TypeScript type definitions
bff/                 # Hono BFF proxy + auth + database
  src/auth/          #   Google OAuth, JWT, middleware
  src/routes/        #   Session CRUD, share page routes
  src/db/            #   Drizzle ORM schema, migrations
  drizzle/           #   Versioned SQL migration files
deploy-hook/         # Staging deploy webhook (FastAPI)
tests/e2e/           # Playwright E2E tests
specs/               # Feature specifications (25 specs)
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
| M6: Compete + Go Native — exam countdown, leaderboards, PWA, iOS app | Next | — |

## License

Private
