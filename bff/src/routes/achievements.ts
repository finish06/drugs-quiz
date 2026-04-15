/**
 * Achievement routes: GET /api/achievements, POST /api/achievements/check,
 * POST /api/achievements/migrate
 * Spec: specs/achievements-badges.md AC-007, AC-008, AC-009, AC-011
 */

import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/index.js";
import { achievements } from "../db/schema.js";
import { evaluateBadges } from "../services/achievements/evaluator.js";
/** Valid badge IDs — kept in sync with src/data/badges.ts catalog */
const VALID_BADGE_IDS = new Set([
  "first-quiz",
  "perfect-score",
  "class-master",
  "centurion",
  "streak-seeker",
]);

export function createAchievementsRouter(): Hono {
  const router = new Hono();

  /**
   * GET /api/achievements
   * Returns the authenticated user's earned badges.
   * AC-009
   */
  router.get("/", authMiddleware, async (c) => {
    const user = c.get("user");

    const rows = await db
      .select({
        badgeId: achievements.badgeId,
        earnedAt: achievements.earnedAt,
        contextJson: achievements.contextJson,
      })
      .from(achievements)
      .where(eq(achievements.userId, user.sub))
      .orderBy(desc(achievements.earnedAt));

    return c.json(
      rows.map((r) => ({
        badgeId: r.badgeId,
        earnedAt: r.earnedAt,
        context: r.contextJson ?? null,
      })),
    );
  });

  /**
   * POST /api/achievements/check
   * Evaluate unlock criteria for the user after a session is saved.
   * AC-007, AC-008
   */
  router.post("/check", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body.sessionId !== "string" || !body.sessionId) {
      return c.json({ error: "bad_request", message: "sessionId is required" }, 400);
    }

    const user = c.get("user");
    const unlocked = await evaluateBadges(user.sub, body.sessionId);

    return c.json({
      unlocked: unlocked.map((u) => ({
        badgeId: u.badgeId,
        earnedAt: u.earnedAt,
        context: u.context,
      })),
    });
  });

  /**
   * POST /api/achievements/migrate
   * Bulk-import guest-earned badges on first sign-in. Idempotent.
   * AC-011
   */
  router.post("/migrate", authMiddleware, async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || !Array.isArray(body.badges)) {
      return c.json({ error: "bad_request", message: "badges array is required" }, 400);
    }

    // Validate all badge IDs upfront
    for (const b of body.badges) {
      if (!b.badgeId || !VALID_BADGE_IDS.has(b.badgeId)) {
        return c.json(
          { error: "bad_request", message: `Unknown badgeId: ${b.badgeId}` },
          400,
        );
      }
    }

    const user = c.get("user");
    let imported = 0;
    let skipped = 0;

    for (const badge of body.badges) {
      try {
        const earnedAt = badge.earnedAt ? new Date(badge.earnedAt) : new Date();
        if (isNaN(earnedAt.getTime())) {
          skipped++;
          continue;
        }

        const result = await db
          .insert(achievements)
          .values({
            userId: user.sub,
            badgeId: badge.badgeId,
            earnedAt,
            contextJson: badge.context ?? null,
          })
          .onConflictDoNothing()
          .returning({ id: achievements.id });

        if (result.length > 0) {
          imported++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    return c.json({ imported, skipped });
  });

  return router;
}
