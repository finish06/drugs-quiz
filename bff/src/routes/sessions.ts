import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/index.js";
import { quizSessions } from "../db/schema.js";
import type { QuizType } from "../db/schema.js";

const VALID_QUIZ_TYPES: QuizType[] = [
  "name-the-class",
  "match-drug-to-class",
  "brand-generic-match",
  "quick-5",
];

const MAX_MIGRATE_SESSIONS = 50;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface MigrateSessionInput {
  quizType: string;
  questionCount: number;
  correctCount: number;
  percentage: number;
  completedAt: string;
}

function isValidSession(s: MigrateSessionInput): boolean {
  if (!VALID_QUIZ_TYPES.includes(s.quizType as QuizType)) return false;
  if (typeof s.questionCount !== "number" || s.questionCount <= 0) return false;
  if (typeof s.correctCount !== "number" || s.correctCount < 0) return false;
  if (s.correctCount > s.questionCount) return false;
  if (typeof s.percentage !== "number" || s.percentage < 0 || s.percentage > 100) return false;
  const date = new Date(s.completedAt);
  if (isNaN(date.getTime())) return false;
  if (date.getTime() > Date.now()) return false;
  return true;
}

export function createSessionsRouter(): Hono {
  const router = new Hono();

  // POST /api/sessions/migrate — bulk import from localStorage
  router.post("/migrate", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || !Array.isArray(body.sessions)) {
      return c.json({ error: "bad_request", message: "Body must contain a sessions array" }, 400);
    }

    if (body.sessions.length > MAX_MIGRATE_SESSIONS) {
      return c.json(
        { error: "bad_request", message: `Maximum ${MAX_MIGRATE_SESSIONS} sessions per request` },
        400,
      );
    }

    const user = c.get("user");
    let migrated = 0;
    let skipped = 0;

    for (const session of body.sessions) {
      if (!isValidSession(session)) {
        skipped++;
        continue;
      }

      try {
        const result = await db
          .insert(quizSessions)
          .values({
            userId: user.sub,
            quizType: session.quizType as QuizType,
            questionCount: session.questionCount,
            correctCount: session.correctCount,
            percentage: session.percentage,
            completedAt: new Date(session.completedAt),
            answersJson: [],
          })
          .onConflictDoNothing()
          .returning({ id: quizSessions.id });

        if (result.length > 0) {
          migrated++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    return c.json({ migrated, skipped });
  });

  // GET /api/sessions — list user's sessions
  router.get("/", authMiddleware, async (c) => {
    const user = c.get("user");
    const limitParam = Number(c.req.query("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);

    const rows = await db
      .select({
        id: quizSessions.id,
        quizType: quizSessions.quizType,
        questionCount: quizSessions.questionCount,
        correctCount: quizSessions.correctCount,
        percentage: quizSessions.percentage,
        completedAt: quizSessions.completedAt,
      })
      .from(quizSessions)
      .where(eq(quizSessions.userId, user.sub))
      .orderBy(desc(quizSessions.completedAt))
      .limit(limit);

    return c.json({ sessions: rows });
  });

  // POST /api/sessions — save a single session
  router.post("/", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: "bad_request", message: "Invalid JSON body" }, 400);
    }

    if (!VALID_QUIZ_TYPES.includes(body.quizType)) {
      return c.json({ error: "bad_request", message: "Invalid quizType" }, 400);
    }

    if (typeof body.questionCount !== "number" || body.questionCount <= 0) {
      return c.json({ error: "bad_request", message: "Invalid questionCount" }, 400);
    }

    if (typeof body.correctCount !== "number" || body.correctCount < 0 || body.correctCount > body.questionCount) {
      return c.json({ error: "bad_request", message: "Invalid correctCount" }, 400);
    }

    if (typeof body.percentage !== "number" || body.percentage < 0 || body.percentage > 100) {
      return c.json({ error: "bad_request", message: "Invalid percentage" }, 400);
    }

    const user = c.get("user");

    const result = await db
      .insert(quizSessions)
      .values({
        userId: user.sub,
        quizType: body.quizType as QuizType,
        questionCount: body.questionCount,
        correctCount: body.correctCount,
        percentage: body.percentage,
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        answersJson: body.answersJson ?? [],
      })
      .returning({
        id: quizSessions.id,
        quizType: quizSessions.quizType,
        questionCount: quizSessions.questionCount,
        correctCount: quizSessions.correctCount,
        percentage: quizSessions.percentage,
        completedAt: quizSessions.completedAt,
      });

    return c.json(result[0], 201);
  });

  return router;
}
