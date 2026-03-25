# Implementation Plan: Database Schema + ORM

**Spec Version:** 0.1.0
**Created:** 2026-03-23
**Team Size:** Solo
**Estimated Duration:** 4 hours

## Overview

Add Drizzle ORM to the Hono BFF with Postgres. Define `users` and `quiz_sessions` tables, versioned migrations, and auto-migrate on startup. Add Postgres to docker-compose.

## Acceptance Criteria Analysis

### AC-001: Drizzle ORM installed in bff/
- **Complexity:** Simple
- **Tasks:** TASK-001
- **Testing:** Verify imports resolve, TypeScript compiles

### AC-002: users table schema
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test for schema shape, migration creates table

### AC-003: quiz_sessions table schema
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test for schema shape, FK constraint

### AC-004: quiz_type enum constraint
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** Unit test rejects invalid quiz types

### AC-005: answers_json stores full AnswerDetail[]
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** JSONB round-trip test

### AC-006: Versioned SQL migrations
- **Complexity:** Medium
- **Tasks:** TASK-003
- **Testing:** Migration files exist, run cleanly

### AC-007: Auto-migrate on BFF startup
- **Complexity:** Medium
- **Tasks:** TASK-004
- **Testing:** BFF logs migration output on boot

### AC-008: DATABASE_URL env var
- **Complexity:** Simple
- **Tasks:** TASK-004
- **Testing:** BFF fails with clear error if missing

### AC-009: Postgres in docker-compose
- **Complexity:** Simple
- **Tasks:** TASK-005
- **Testing:** `docker-compose up` starts Postgres

### AC-010: BFF depends_on Postgres healthcheck
- **Complexity:** Simple
- **Tasks:** TASK-005
- **Testing:** BFF waits for Postgres healthy

### AC-011: Connection pooling via Drizzle driver
- **Complexity:** Simple
- **Tasks:** TASK-004
- **Testing:** Multiple queries succeed

### AC-012: Schema types exported
- **Complexity:** Simple
- **Tasks:** TASK-002
- **Testing:** TypeScript imports from schema.ts

### AC-013: .env.example updated
- **Complexity:** Simple
- **Tasks:** TASK-006
- **Testing:** File contains DATABASE_URL

### AC-014: npm run db:generate script
- **Complexity:** Simple
- **Tasks:** TASK-003
- **Testing:** Script runs drizzle-kit generate

### AC-015: Existing BFF functionality unaffected
- **Complexity:** Simple
- **Tasks:** TASK-007
- **Testing:** Health check + proxy still work

## Implementation Phases

### Phase 1: Dependencies + Schema Definition (RED)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-001 | Install drizzle-orm, drizzle-kit, postgres driver in bff/ | 15min | — | AC-001 |
| TASK-002 | Define schema.ts with users + quiz_sessions tables, enum, types | 30min | TASK-001 | AC-002, AC-003, AC-004, AC-005, AC-012 |
| TASK-003 | Create drizzle.config.ts, add db:generate script, generate initial migration | 20min | TASK-002 | AC-006, AC-014 |

**Write failing tests before implementation:**
- Schema shape tests (table columns, types, constraints)
- CRUD operation tests (insert user, insert session, FK violation)
- JSONB round-trip test for answers_json

### Phase 2: Connection + Auto-Migrate (GREEN)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-004 | Create db/index.ts (connection) + db/migrate.ts (auto-migrate on startup) | 45min | TASK-003 | AC-007, AC-008, AC-011 |
| TASK-005 | Add Postgres service to docker-compose.yml with healthcheck + volume | 20min | — | AC-009, AC-010 |
| TASK-006 | Update .env.example with DATABASE_URL | 5min | — | AC-013 |

### Phase 3: Integration + Verify (REFACTOR + VERIFY)

| Task ID | Description | Effort | Dependencies | AC |
|---------|-------------|--------|--------------|-----|
| TASK-007 | Wire auto-migrate into BFF startup (index.ts), verify proxy + health unaffected | 30min | TASK-004 | AC-007, AC-015 |
| TASK-008 | Run full test suite, lint, types, coverage check | 30min | TASK-007 | All |
| TASK-009 | Docker-compose integration test: up → BFF connects → tables exist | 20min | TASK-005, TASK-007 | AC-009, AC-010 |

## Effort Summary

| Phase | Estimated | Tasks |
|-------|-----------|-------|
| Phase 1: Schema + Tests | 1.5h | 3 |
| Phase 2: Connection + Infra | 1.5h | 3 |
| Phase 3: Integration + Verify | 1h | 3 |
| **Total** | **4h** | **9** |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| bff/package.json | Modify | Add drizzle-orm, drizzle-kit, postgres dependencies |
| bff/src/db/schema.ts | Create | Table definitions, enum, exported types |
| bff/src/db/index.ts | Create | Drizzle client + connection pool |
| bff/src/db/migrate.ts | Create | Auto-migration logic |
| bff/drizzle.config.ts | Create | Drizzle Kit configuration |
| bff/drizzle/*.sql | Create | Generated migration files |
| bff/src/index.ts | Modify | Call migrate on startup |
| docker-compose.yml | Modify | Add postgres service, healthcheck, volume |
| .env.example | Modify | Add DATABASE_URL |
| bff/src/db/*.test.ts | Create | Schema + CRUD tests |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Drizzle + Hono integration issues | Low | Medium | Both are well-documented, common pairing |
| Docker Postgres healthcheck timing | Low | Low | Use pg_isready, proven pattern |
| Migration conflicts in CI | Low | Medium | Migrations committed to git, deterministic |

## Testing Strategy

1. **Unit tests** — Schema shape validation, CRUD operations, FK constraints, JSONB round-trip
2. **Integration test** — docker-compose up → BFF connects → migrations run → tables exist
3. **Regression** — Existing BFF health + proxy tests still pass

## Next Steps

1. Begin TDD cycle: write failing schema tests
2. Implement schema + connection
3. Verify with docker-compose
4. Proceed to google-oauth plan
