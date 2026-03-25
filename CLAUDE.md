# drugs-quiz

A React frontend app that quizzes pharmacy professionals (students, pharmacists, technicians) on drug names, brand/generic pairs, and pharmacological classes. Powered by the drug-gate API with real FDA/DailyMed data. Features dark mode with OS preference detection, spaced repetition with flashcard drills, session history with personal best tracking, and a Quick 5 mixed-quiz entry point.

## Methodology

This project follows **Agent Driven Development (ADD)** — specs drive agents, humans architect and decide, trust-but-verify ensures quality.

- **PRD:** docs/prd.md
- **Specs:** specs/
- **Plans:** docs/plans/
- **Config:** .add/config.json
- **API Contract:** frontend-api-contract.md

Document hierarchy: PRD → Spec → Plan → User Test Cases → Automated Tests → Implementation

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.x |
| Frontend | React | 19 |
| Bundler | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| BFF Proxy | Hono | latest |
| ORM | Drizzle ORM | latest |
| Database | PostgreSQL | 16 |
| Auth | Google OAuth 2.0 (arctic) + JWT (jose) | latest |
| Testing | Vitest + React Testing Library | latest |
| E2E | Playwright | latest |
| Deploy Webhook | FastAPI (Python) | latest |
| Native (future) | Capacitor | — |
| Containers | Docker + docker-compose | — |

## Commands

### Development
```
npm run dev                      # Start local dev server (Vite + proxy)
npx vitest run                   # Run unit tests
npx playwright test              # Run E2E tests
npx eslint .                     # Lint check (flat config, no --ext needed)
npx tsc --noEmit                 # Type check
docker compose up                # Run full stack locally (nginx + BFF)
```

### ADD Workflow
```
/add:spec {feature}              # Create feature specification
/add:plan specs/{feature}.md     # Create implementation plan
/add:tdd-cycle specs/{feature}.md # Execute TDD cycle
/add:verify                      # Run quality gates
/add:deploy                      # Commit and deploy
/add:away {duration}             # Human stepping away
```

## Architecture

### Request Flow (Production)

```
Browser (React SPA)
  → nginx (:8080, serves static assets + proxies /api/)
    → Hono BFF (:3001, injects X-API-Key, auth middleware)
      → drug-gate API (upstream)
      → PostgreSQL (users, quiz_sessions)
```

In development, Vite's dev server proxy replaces nginx + BFF, injecting the API key directly.

### Auth Flow

```
Browser → /api/auth/google → Google OAuth consent → /api/auth/google/callback
  → BFF creates/finds user in DB → issues JWT (httpOnly cookie, 30-day expiry)
  → redirect to app → AuthContext reads /api/auth/me → header shows user avatar
```

Auth is **additive** — all existing features work without an account. Authenticated users unlock cloud features (session sync, sharing).

### Key Directories
```
src/                             # React application source
  components/                    # UI components (see Components below)
  contexts/                      # React contexts (AuthContext)
  hooks/                         # Custom React hooks (see Hooks below)
  utils/                         # Utility functions (text.ts)
  services/                      # API client (api-client.ts) and question generators (quiz-generators.ts)
  types/                         # TypeScript type definitions (api.ts, quiz.ts)
bff/                             # Hono BFF proxy server
  src/index.ts                   # Proxy: /api/* → drug-gate with X-API-Key injection + auth routes
  src/db/                        # Drizzle ORM: schema, connection, migrations
    schema.ts                    # users + quiz_sessions table definitions
    index.ts                     # Drizzle client + Postgres connection
    migrate.ts                   # Auto-migration on startup
  src/auth/                      # Auth layer
    google.ts                    # OAuth routes (redirect, callback, /me, logout)
    jwt.ts                       # JWT sign/verify utilities (jose)
    middleware.ts                # Auth middleware for protected routes
  drizzle/                       # Versioned SQL migration files
deploy-hook/                     # Staging deploy webhook service (FastAPI + Python)
  app/main.py                    # Webhook handler: signature verify, compose pull, smoke tests
  apps.yaml                      # Per-app config (compose_dir, health_checks)
  docker-compose.yml             # Deploy-hook container config
specs/                           # Feature specifications (19 spec files)
docs/                            # PRD, plans, milestones, sequence diagrams
  plans/                         # Implementation plans
  milestones/                    # Milestone tracking
  sequence-diagram.md            # Mermaid sequence diagrams for all flows
tests/                           # Test infrastructure (setup.ts)
  e2e/                           # Playwright E2E tests
  screenshots/                   # Visual verification
.add/                            # ADD methodology config, docs-manifest, learnings
```

Note: Unit/component tests are collocated next to source files (e.g., `QuizConfig.test.tsx` alongside `QuizConfig.tsx`).

### Components

| Component | File | Description |
|-----------|------|-------------|
| QuizConfig | `src/components/QuizConfig.tsx` | Quiz configuration screen with type selection, question count, Quick 5 button, session history, and personal best |
| Quick5Button | `src/components/Quick5Button.tsx` | Prominent CTA for Quick 5 mixed-quiz mode |
| SessionHistory | `src/components/SessionHistory.tsx` | Collapsible session history list with personal best badges per quiz type |
| MultipleChoice | `src/components/MultipleChoice.tsx` | Name-the-Class question with 4 options, inline answer feedback |
| MatchingQuiz | `src/components/MatchingQuiz.tsx` | Two-column matching (drug-to-class or brand-to-generic) with color-coded pairs |
| AnswerFeedback | `src/components/AnswerFeedback.tsx` | Inline correct/incorrect feedback shown after answering |
| QuizResults | `src/components/QuizResults.tsx` | End-of-session results: score, breakdown, answer review, "Study Weak Drugs" option |
| AnswerReviewSection | `src/components/AnswerReviewSection.tsx` | Collapsible per-question review with user answers vs correct answers |
| FlashcardDrill | `src/components/FlashcardDrill.tsx` | Study mode for weak drugs: reveal card, show class and accuracy stats |
| UserMenu | `src/components/UserMenu.tsx` | Sign-in button (unauthenticated) or user avatar + dropdown with sign-out (authenticated) |
| ErrorBoundary | `src/components/ErrorBoundary.tsx` | React error boundary wrapping the app |

### Hooks

| Hook | File | Description |
|------|------|-------------|
| useQuizSession | `src/hooks/useQuizSession.ts` | Core session state machine with progressive loading (first 2 sync, rest in background) |
| useTheme | `src/hooks/useTheme.ts` | Dark mode with localStorage persistence and OS preference detection |
| useSessionHistory | `src/hooks/useSessionHistory.ts` | Last 10 sessions in localStorage, personal best per quiz type, collapsible state |
| useDrugPerformance | `src/hooks/useDrugPerformance.ts` | Spaced repetition: per-drug accuracy tracking, weight computation, weak drug detection (< 60% accuracy), 200-drug LRU eviction |
| useAuth | `src/hooks/useAuth.ts` | Consumes AuthContext — provides user, isAuthenticated, isLoading, login(), logout() |

### Contexts

| Context | File | Description |
|---------|------|-------------|
| AuthContext | `src/contexts/AuthContext.tsx` | AuthProvider wraps the app, checks `/api/auth/me` on mount, manages auth state |

### API Integration

The app consumes the drug-gate API (see `frontend-api-contract.md`):
- `GET /v1/drugs/names` — browse/search drug names
- `GET /v1/drugs/classes` — browse pharmacological classes
- `GET /v1/drugs/class?name={name}` — look up drug's class
- `GET /v1/drugs/classes/drugs?class={name}` — list drugs in a class
- `GET /v1/drugs/ndc/{ndc}` — look up drug by NDC

All requests go through `/api` — the BFF proxy (production) or Vite dev proxy (development) injects the `X-API-Key` header. The api-client (`src/services/api-client.ts`) is a thin typed wrapper with `DrugApiError` for non-OK responses.

### Auth Endpoints (BFF)

- `GET /api/auth/google` — initiate Google OAuth redirect (generates CSRF state + PKCE code verifier cookies)
- `GET /api/auth/google/callback` — handle OAuth callback (PKCE verification), create/find user, issue JWT cookie
- `GET /api/auth/me` — return current user profile (401 if not authenticated)
- `POST /api/auth/logout` — clear JWT cookie

JWT is stored as httpOnly cookie (`auth_token`), 30-day expiry, Secure + SameSite=Lax.

### Database

Drizzle ORM with PostgreSQL. Schema in `bff/src/db/schema.ts`:

- **users** — id (UUID), email (unique), name, avatar_url, oauth_provider, created_at, updated_at
- **quiz_sessions** — id (UUID), user_id (FK → users), quiz_type (enum), question_count, correct_count, percentage, completed_at, answers_json (JSONB)

Migrations in `bff/drizzle/`, auto-run on BFF startup. Connection via `DATABASE_URL` env var.

### Question Generation

Quiz generators (`src/services/quiz-generators.ts`) use batched pre-fetching for performance:

1. **Class pool**: `fetchEpcClassPool()` fetches 2 random pages of EPC classes in parallel (~200 classes)
2. **Batch fetch**: `batchFetchDrugs()` uses `Promise.allSettled` to fetch drugs for 8-12 classes simultaneously
3. **Drug deduplication**: A shared `usedDrugs` set prevents the same drug appearing across questions in a session
4. **Exam relevance filter**: `isExamRelevantDrug()` filters out overly long names, multi-ingredient compounds, and homeopathic preparations
5. **Quick 5 mode**: `generateSingleQuestion("quick-5", ...)` picks a random quiz type per question

### Docker Compose

- **`docker-compose.yml`**: Local development — builds from source (app + BFF + Postgres)
- **`docker-compose.staging.yml`**: Staging — pulls images from `dockerhub.calebdunn.tech`, uses `internal` network, separate `nginx-staging.conf`

Services in `docker-compose.yml`: `app` (nginx frontend), `bff` (Hono proxy + auth + DB), `postgres` (PostgreSQL 16-alpine with persistent volume + healthcheck). BFF depends on Postgres being healthy before starting.

### Environments

- **Local:** Docker Compose (build from source), http://localhost:8080
- **Staging:** Dedicated VM on homelab, deployed via deploy-hook webhook, images from private registry
- **Production:** AWS EC2 instance

### Environment Variables

All env vars are documented in `.env.example`. Key variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `DRUG_GATE_URL` | Upstream drug-gate API URL | Yes |
| `DRUG_GATE_API_KEY` | API key for drug-gate | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes (BFF) |
| `POSTGRES_PASSWORD` | Postgres password (docker-compose) | Yes (local) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | Yes (auth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | Yes (auth) |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | Yes (auth) |
| `APP_URL` | Application URL for OAuth redirects | Yes (auth) |
| `CORS_ORIGIN` | Allowed CORS origin (optional, same-origin if unset) | No |
| `PORT` | BFF listen port (default: 3001) | No |

**GCP Project:** `rx-quiz-app` (Google Cloud project for OAuth credentials)

### Deploy Webhook

The `deploy-hook/` service runs on the staging VM and handles automated deployments:

1. GitHub Actions builds and pushes Docker images after merge to main
2. CI sends `POST /deploy { app: "drugs-quiz", tag: "beta" }` with HMAC signature
3. deploy-hook validates signature, pulls images via `docker compose pull`, restarts with `up -d`
4. Runs smoke tests (BFF health check + API proxy check) before reporting success
5. Per-app deploy locks prevent concurrent deployments

## Quality Gates

- **Mode:** Strict
- **Coverage threshold:** 90%
- **Type checking:** Blocking
- **E2E required:** Yes

All gates defined in `.add/config.json`. Run `/add:verify` to check.

## Source Control

- **Git host:** GitHub
- **Branching:** Feature branches off `main`
- **Commits:** Conventional commits (feat:, fix:, test:, refactor:, docs:)
- **CI/CD:** GitHub Actions (build, test, push images, trigger deploy-hook)

## Collaboration

- **Autonomy level:** Balanced — work within specs autonomously, check at PR time
- **Deploy approval:** Required for production
