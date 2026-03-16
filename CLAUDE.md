# drugs-quiz

A React frontend app that quizzes pharmacy professionals (students, pharmacists, technicians) on drug names, brand/generic pairs, and pharmacological classes. Powered by the drug-gate API with real FDA/DailyMed data. Features dark mode with OS preference detection and an in-memory API response cache.

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
| Testing | Vitest + React Testing Library | latest |
| E2E | Playwright | latest |
| Native (future) | Capacitor | — |
| Containers | Docker + docker-compose | — |

## Commands

### Development
```
npm run dev                      # Start local dev server
npx vitest run                   # Run unit tests
npx playwright test              # Run E2E tests
npx eslint .                     # Lint check (flat config, no --ext needed)
npx tsc --noEmit                 # Type check
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

### Key Directories
```
src/                             # React application source
  components/                    # UI components (QuizConfig, MultipleChoice, MatchingQuiz, QuizResults)
  hooks/                         # Custom React hooks (useQuizSession, useTheme)
  utils/                         # Utility functions (text.ts)
  services/                      # API client (api-client.ts) and question generators (quiz-generators.ts)
  types/                         # TypeScript type definitions (api.ts, quiz.ts)
specs/                           # Feature specifications (5 spec files)
docs/                            # PRD, plans, milestones, sequence diagrams
  plans/                         # Implementation plans
  milestones/                    # Milestone tracking
tests/                           # Test infrastructure (setup.ts)
  e2e/                           # Playwright E2E tests (not yet written)
  screenshots/                   # Visual verification
.add/                            # ADD methodology config, docs-manifest, learnings
```

Note: Unit/component tests are collocated next to source files (e.g., `QuizConfig.test.tsx` alongside `QuizConfig.tsx`).

### API Integration

The app consumes the drug-gate API (see `frontend-api-contract.md`):
- `GET /v1/drugs/names` — browse/search drug names
- `GET /v1/drugs/classes` — browse pharmacological classes
- `GET /v1/drugs/class?name={name}` — look up drug's class
- `GET /v1/drugs/classes/drugs?class={name}` — list drugs in a class
- `GET /v1/drugs/ndc/{ndc}` — look up drug by NDC

All endpoints require `X-API-Key` header. Responses are cached in-memory for 5 minutes (`requestCache` in `api-client.ts`) to avoid redundant network calls during quiz generation.

### Environments

- **Local:** Docker Compose, http://localhost:5173
- **Staging:** Dedicated VM on homelab (SSH deploy)
- **Production:** AWS EC2 instance

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
- **CI/CD:** GitHub Actions

## Collaboration

- **Autonomy level:** Balanced — work within specs autonomously, check at PR time
- **Deploy approval:** Required for production
