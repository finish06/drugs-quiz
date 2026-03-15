# drugs-quiz

A React frontend app that quizzes pharmacy professionals (students, pharmacists, technicians) on drug names, brand/generic pairs, and pharmacological classes. Powered by the drug-gate API with real FDA/DailyMed data.

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
| Frontend | React | 18 |
| Bundler | Vite | latest |
| Styling | Tailwind CSS | 3.x |
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
npx eslint . --ext .ts,.tsx      # Lint check
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
  components/                    # Reusable UI components
  pages/                         # Page-level components
  hooks/                         # Custom React hooks
  services/                      # API client and data fetching
  types/                         # TypeScript type definitions
  utils/                         # Utility functions
specs/                           # Feature specifications
docs/                            # PRD, plans, milestones
  plans/                         # Implementation plans
  milestones/                    # Milestone tracking
tests/                           # Test artifacts
  unit/                          # Unit tests (collocated or here)
  integration/                   # Integration tests
  e2e/                           # Playwright E2E tests
  screenshots/                   # Visual verification
.add/                            # ADD methodology config
```

### API Integration

The app consumes the drug-gate API (see `frontend-api-contract.md`):
- `GET /v1/drugs/names` — browse/search drug names
- `GET /v1/drugs/classes` — browse pharmacological classes
- `GET /v1/drugs/class?name={name}` — look up drug's class
- `GET /v1/drugs/classes/drugs?class={name}` — list drugs in a class
- `GET /v1/drugs/ndc/{ndc}` — look up drug by NDC

All endpoints require `X-API-Key` header.

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
