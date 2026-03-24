# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Added
- Drizzle ORM with Postgres in BFF — `users` and `quiz_sessions` tables
- Versioned SQL migrations via drizzle-kit, auto-migrate on BFF startup
- Google OAuth 2.0 via BFF (arctic library) with JWT sessions (jose)
- Auth middleware for protected BFF routes with CSRF state parameter
- AuthContext + AuthProvider for frontend auth state management
- UserMenu component — sign-in button / avatar + dropdown in header
- useAuth hook for consuming auth state
- Postgres service in docker-compose with healthcheck and persistent volume
- M5 milestone planning (Go Social — Accounts + Viral Distribution)
- M6 milestone planning (Compete + Go Native) with Capacitor iOS spec

## [0.4.0] - 2026-03-22

### Added
- Comprehensive E2E test suite — 6 Playwright spec files, 11+ test scenarios
- Rx logo, favicon, and project infographic
- Automated staging deploy via deploy-hook webhook (FastAPI)
- App-aware deploy-hook with YAML config and HMAC signature verification
- CI/CD pipeline: build, test, push images to registry, trigger deploy-hook
- GitHub Actions workflow for GHCR.io release images

### Fixed
- 4 tier-2 bugs: race condition in quiz start, error boundary, double-click guard, exit confirmation
- E2E selector ambiguity and mobile browser config
- Deploy-hook volume mounts and smoke test URLs
- Multi-stage BFF Dockerfile — install TypeScript in build stage

## [0.3.1] - 2026-03-21

### Fixed
- 9 tier-1 bugs from swarm audit (CORS, error handling, edge cases)
- Staging redeployed from /opt with BFF proxy and correct CORS

## [0.3.0] - 2026-03-20

### Added
- BFF proxy service (Hono) — moves API key server-side
- Batched pre-fetching with Promise.allSettled for quiz generation
- Answer review mode — correct answers with drug class context after each quiz
- Spaced repetition (localStorage) — per-drug accuracy tracking, weak drug surfacing
- Session history + personal best tracking (localStorage, last 10 sessions)
- Quick 5 entry point — one-tap 5-question mixed quiz
- Beta maturity promotion (evidence score 9/10)

### Changed
- API requests now route through BFF proxy in production (API key never in client)

### Performance
- Quiz generation uses batched pre-fetching — sub-1s load on warm cache

## [0.2.0] - 2026-03-18

### Added
- SEO optimization — OG tags, structured data, sitemap, robots.txt
- Dark mode with OS preference detection and localStorage persistence
- Loading progress indicator for question generation
- CI Docker registry push for beta and release images

## [0.1.0] - 2026-03-15

### Added
- Initial release — 3 quiz types (Name the Class, Match Drug to Class, Brand/Generic Match)
- Quiz configuration screen with type selection and question count
- Quiz session management with scoring and results
- Lazy load quiz questions — start after 2, generate rest in background
- Playwright E2E tests for quiz flow
- API client with typed endpoints for drug-gate API
- Docker + docker-compose setup
