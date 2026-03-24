# Spec: Database Schema + ORM

**Version:** 0.1.0
**Created:** 2026-03-23
**PRD Reference:** docs/prd.md M5 (Go Social — Accounts + Viral Distribution)
**Status:** Draft

## 1. Overview

Add Drizzle ORM to the Hono BFF with Postgres as the database. Define the foundational schema for user accounts and cloud-synced quiz sessions. Migrations are versioned SQL files committed to git. The BFF auto-migrates on startup.

### User Story

As a developer, I want a database schema and ORM layer in the BFF so that user accounts and quiz sessions can be persisted server-side, enabling OAuth login and cloud sync of localStorage data.

## 2. Acceptance Criteria

| ID | Criterion | Priority |
|----|-----------|----------|
| AC-001 | Drizzle ORM is installed in `bff/` with `drizzle-orm` and `drizzle-kit` packages | Must |
| AC-002 | A `users` table exists with columns: id (UUID, PK), email (unique, not null), name, avatar_url, oauth_provider, created_at, updated_at | Must |
| AC-003 | A `quiz_sessions` table exists with columns: id (UUID, PK), user_id (FK → users.id), quiz_type (enum), question_count, correct_count, percentage, completed_at, answers_json (JSONB) | Must |
| AC-004 | `quiz_type` is constrained to valid values: `name-the-class`, `match-drug-to-class`, `brand-generic-match`, `quick-5` | Must |
| AC-005 | `answers_json` stores the full `AnswerDetail[]` array (question text, user answer, correct answer per question) | Must |
| AC-006 | Versioned SQL migration files are generated via `drizzle-kit generate` and committed to `bff/drizzle/` | Must |
| AC-007 | The BFF runs migrations automatically on startup via `drizzle-kit migrate` with log output | Must |
| AC-008 | Database connection is configured via `DATABASE_URL` environment variable | Must |
| AC-009 | A Postgres service is added to `docker-compose.yml` with a persistent volume | Must |
| AC-010 | The BFF's `docker-compose` service depends on the Postgres service being healthy | Must |
| AC-011 | Connection pooling is handled via Drizzle's Postgres driver (`postgres` or `pg`) | Must |
| AC-012 | Schema TypeScript types are exported for use by BFF route handlers | Must |
| AC-013 | `.env.example` is updated with `DATABASE_URL` | Should |
| AC-014 | A `npm run db:generate` script exists in `bff/package.json` for creating new migrations | Should |
| AC-015 | Existing BFF proxy functionality (health check, API proxy) is unaffected | Must |

## 3. User Test Cases

### TC-001: Fresh database setup via docker-compose

**Precondition:** No existing Postgres data volume
**Steps:**
1. Run `docker-compose up`
2. Observe BFF startup logs
3. Connect to Postgres and inspect tables
**Expected Result:** Postgres starts, BFF connects, migrations run automatically. `users` and `quiz_sessions` tables exist with correct columns and constraints.
**Screenshot Checkpoint:** N/A (backend-only)
**Maps to:** TBD

### TC-002: BFF starts with existing migrated database

**Precondition:** Postgres already running with tables created from a previous startup
**Steps:**
1. Restart the BFF service (`docker-compose restart bff`)
2. Observe BFF startup logs
**Expected Result:** BFF detects no pending migrations, starts normally. Existing data is preserved.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-003: Insert and query a user record

**Precondition:** Database is migrated and running
**Steps:**
1. Insert a user via Drizzle ORM (in a test or script)
2. Query the user back by email
**Expected Result:** User is persisted with all fields. `created_at` and `updated_at` are auto-populated. UUID `id` is generated.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-004: Insert a quiz session with answer details

**Precondition:** A user exists in the database
**Steps:**
1. Insert a `quiz_session` with `user_id` FK, quiz metadata, and `answers_json` containing an `AnswerDetail[]` array
2. Query the session back and parse `answers_json`
**Expected Result:** Session is persisted. `answers_json` round-trips correctly as a typed array. Foreign key to `users` is enforced.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

### TC-005: Foreign key constraint prevents orphan sessions

**Precondition:** Database is migrated, no users exist
**Steps:**
1. Attempt to insert a `quiz_session` with a non-existent `user_id`
**Expected Result:** Insert fails with a foreign key violation error.
**Screenshot Checkpoint:** N/A
**Maps to:** TBD

## 4. Data Model

### users

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes (PK, auto-generated) | Primary key |
| email | VARCHAR(255) | Yes (unique) | User's email from OAuth provider |
| name | VARCHAR(255) | No | Display name from OAuth profile |
| avatar_url | TEXT | No | Profile photo URL from OAuth provider |
| oauth_provider | VARCHAR(50) | Yes | OAuth provider identifier (e.g., `google`) |
| created_at | TIMESTAMP | Yes (default: now()) | Account creation time |
| updated_at | TIMESTAMP | Yes (default: now()) | Last update time |

### quiz_sessions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes (PK, auto-generated) | Primary key |
| user_id | UUID | Yes (FK → users.id) | Owning user |
| quiz_type | quiz_type_enum | Yes | One of: name-the-class, match-drug-to-class, brand-generic-match, quick-5 |
| question_count | INTEGER | Yes | Total questions in session |
| correct_count | INTEGER | Yes | Number of correct answers |
| percentage | REAL | Yes | Score as decimal (0.0–100.0) |
| completed_at | TIMESTAMP | Yes | When the session was finished |
| answers_json | JSONB | Yes | Full AnswerDetail[] array |

### Relationships

- `quiz_sessions.user_id` → `users.id` (many-to-one, CASCADE on delete)
- A user can have many quiz sessions
- Deleting a user cascades to delete their sessions

### TypeScript Types (exported from schema)

```typescript
// Inferred from Drizzle schema
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type QuizSession = typeof quizSessions.$inferSelect;
type NewQuizSession = typeof quizSessions.$inferInsert;

// Quiz type enum values
type QuizType = 'name-the-class' | 'match-drug-to-class' | 'brand-generic-match' | 'quick-5';
```

## 5. API Contract

No new API endpoints in this spec. The schema and ORM layer are consumed internally by the BFF. Auth routes (specs/google-oauth.md) and session sync routes will use these types.

## 6. Architecture

### File Structure

```
bff/
├── src/
│   ├── index.ts              # Existing Hono server (proxy + health)
│   └── db/
│       ├── index.ts           # Drizzle client + connection
│       ├── schema.ts          # Table definitions (users, quiz_sessions)
│       └── migrate.ts         # Auto-migration on startup
├── drizzle/                   # Generated SQL migration files
│   └── 0001_initial.sql
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json               # + drizzle-orm, drizzle-kit, postgres
├── tsconfig.json
└── Dockerfile
```

### docker-compose.yml additions

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: drugs_quiz
      POSTGRES_USER: drugs_quiz
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-localdev}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U drugs_quiz"]
      interval: 5s
      timeout: 3s
      retries: 5

  bff:
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://drugs_quiz:${POSTGRES_PASSWORD:-localdev}@postgres:5432/drugs_quiz

volumes:
  pgdata:
```

### Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `POSTGRES_PASSWORD` | No | `localdev` | Postgres password (docker-compose default) |

## 7. Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Postgres not reachable on BFF startup | BFF logs error and exits with non-zero code (crash loop restarts in docker-compose) |
| Migration fails (bad SQL) | BFF logs migration error and exits — does not start serving requests |
| Duplicate email insert | Database rejects with unique constraint violation; caller handles error |
| Very large answers_json | JSONB has no practical size limit; Drizzle handles serialization |
| Concurrent BFF instances running migrations | Drizzle-kit uses advisory locks to prevent concurrent migration runs |
| quiz_type value not in enum | Database rejects with check constraint violation |

## 8. Dependencies

- Existing BFF in `bff/src/index.ts` — extend with DB initialization
- `docker-compose.yml` — add Postgres service
- `.env.example` — add `DATABASE_URL`
- Frontend types in `src/types/quiz.ts` — `AnswerDetail` type definition (for `answers_json` shape reference)

## 9. Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-03-23 | 0.1.0 | Caleb Dunn | Initial spec from /add:spec interview |
