# Spec: BFF Proxy Service

**Version:** 0.1.0
**Created:** 2026-03-20
**PRD Reference:** docs/prd.md M4 (Infrastructure + Quality Hardening)
**Status:** Draft

## 1. Overview

Add a lightweight Hono-based BFF (Backend For Frontend) proxy that sits between the React frontend and the drug-gate API. The proxy injects the API key server-side, eliminating client-side exposure. This is a pure passthrough — no caching, no business logic.

### User Story

As a developer, I want the API key handled server-side so that it's never exposed in the browser, and so we have a surface for future auth (M5 OAuth).

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | A Hono server in `bff/` proxies all `/api/v1/*` requests to drug-gate with `X-API-Key` header injected | Must |
| AC-002 | The BFF reads `DRUG_GATE_URL` and `DRUG_GATE_API_KEY` from environment variables | Must |
| AC-003 | The frontend `api-client.ts` calls `/api/v1/*` on same origin (no DRUG_GATE env vars in frontend) | Must |
| AC-004 | The in-memory request cache in `api-client.ts` is removed (drug-gate's 60-min server cache is sufficient) | Must |
| AC-005 | `docker-compose.yml` includes both `app` (nginx frontend) and `bff` (Hono proxy) services | Must |
| AC-006 | The nginx config proxies `/api` requests to the BFF container | Must |
| AC-007 | BFF has its own `bff/Dockerfile`, `bff/package.json`, and `bff/tsconfig.json` | Must |
| AC-008 | CORS is configured on the BFF for local dev (localhost:5173) | Must |
| AC-009 | BFF returns drug-gate error responses transparently (status code + body preserved) | Must |
| AC-010 | `docker-compose up` starts both containers and the frontend can fetch quiz data through the proxy | Must |
| AC-011 | Vite dev proxy continues to work for local development (no BFF needed in dev mode) | Must |
| AC-012 | BFF has health check endpoint `GET /health` returning `{ "status": "ok" }` | Should |

## 3. User Test Cases

### TC-001: Production proxy flow
**Steps:**
1. `docker-compose up`
2. Open http://localhost:8080
3. Start a quiz
**Expected Result:** Quiz loads successfully. Network tab shows requests to `/api/v1/*` going to nginx → BFF → drug-gate. No `X-API-Key` visible in browser.

### TC-002: Dev proxy flow (unchanged)
**Steps:**
1. `npm run dev`
2. Start a quiz
**Expected Result:** Quiz loads via Vite dev proxy as before. BFF not involved.

## 4. Architecture

```
Production/Staging:
  Browser → nginx:80 ─┬─ /api/* → bff:3001 → drug-gate (+ X-API-Key)
                       └─ /*     → static files (React SPA)

Development:
  Browser → vite:5173 ─┬─ /api/* → drug-gate (+ X-API-Key via vite proxy)
                        └─ /*     → HMR dev server
```

### BFF Service

```
bff/
├── src/
│   └── index.ts        # Hono server: proxy routes + health check
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Environment Variables (BFF only)

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `DRUG_GATE_URL` | Yes | — | drug-gate API base URL |
| `DRUG_GATE_API_KEY` | Yes | — | API key for X-API-Key header |
| `PORT` | No | 3001 | BFF listen port |
| `CORS_ORIGIN` | No | * | Allowed CORS origin |

## 5. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| drug-gate is down | BFF returns 502 with error message |
| Invalid API key | BFF transparently returns drug-gate's 401 |
| Rate limited | BFF transparently returns drug-gate's 429 with Retry-After |
| BFF is down | nginx returns 502 for `/api/*` requests; frontend shows error state |
| Large response | BFF streams response through without buffering |

## 6. Dependencies

- Frontend `api-client.ts` — remove cache, keep `/api` base path
- `docker-compose.yml` — add BFF service
- `nginx.conf` — add `/api` upstream to BFF
- `.env.example` — already has the right vars

## 7. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-20 | 0.1.0 | Caleb Dunn | Initial spec from cycle 5 interview |
