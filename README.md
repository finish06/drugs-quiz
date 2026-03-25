# Rx Quiz

A quiz app for pharmacy professionals to master drug names, brand/generic pairs, and pharmacological classes. Powered by real FDA/DailyMed data via the [drug-gate API](https://github.com/finish06/drug-gate).

## Features

- **Name the Class** — Multiple-choice: identify a drug's pharmacological class
- **Match Drug to Class** — Two-column matching: pair drugs with their classes
- **Brand/Generic Match** — Two-column matching: pair generic names with brand names
- **Quick 5** — Five random mixed-type questions for a fast study session
- **Spaced Repetition** — Tracks per-drug accuracy, surfaces weak drugs (<60%) for flashcard drills
- **Session History** — Last 10 sessions with personal best tracking per quiz type
- **Dark Mode** — Automatic OS preference detection with manual toggle
- **Google Sign-In** — Optional account for cloud features (session sync, sharing)

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
  → nginx (:8080, serves static assets + proxies /api/)
    → Hono BFF (:3001, injects X-API-Key, auth middleware)
      → drug-gate API (upstream)
      → PostgreSQL (users, quiz_sessions)
```

Auth is **additive** — the app works fully without an account. Sign-in unlocks cloud features.

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
src/                 # React frontend (components, hooks, contexts, services, types)
bff/                 # Hono BFF proxy + auth + database
deploy-hook/         # Staging deploy webhook (FastAPI)
tests/e2e/           # Playwright E2E tests
specs/               # Feature specifications (19 specs)
docs/                # PRD, plans, milestones, sequence diagrams
```

## License

Private
