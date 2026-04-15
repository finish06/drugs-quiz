/**
 * Server-side badge evaluator.
 * Spec: specs/achievements-badges.md AC-002..006, AC-007, AC-008, AC-015
 *
 * Evaluates which badges a user should unlock after a session is saved.
 * Uses UTC server timestamps only — client clock never consulted (AC-015).
 */

import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { quizSessions, achievements } from "../../db/schema.js";

export interface BadgeUnlock {
  badgeId: string;
  earnedAt: Date;
  /** Optional context data, e.g. { className } for Class Master */
  context: Record<string, unknown> | null;
}

/**
 * Evaluate which new badges the user earns after the given session.
 * Inserts newly-earned rows with ON CONFLICT DO NOTHING for idempotency.
 * Returns only the newly-unlocked badges (existing ones excluded).
 */
/** Threshold for Class Master: N distinct drugs correctly named in the same class. */
export const CLASS_MASTER_DRUGS_REQUIRED = 7;

export async function evaluateBadges(userId: string, sessionId: string): Promise<BadgeUnlock[]> {
  // Fetch all user sessions (ordered newest first for streak computation)
  const allSessions = await db
    .select({
      id: quizSessions.id,
      quizType: quizSessions.quizType,
      questionCount: quizSessions.questionCount,
      correctCount: quizSessions.correctCount,
      percentage: quizSessions.percentage,
      completedAt: quizSessions.completedAt,
      answersJson: quizSessions.answersJson,
    })
    .from(quizSessions)
    .where(eq(quizSessions.userId, userId))
    .orderBy(desc(quizSessions.completedAt));

  // Fetch existing achievements to avoid re-awarding
  const existingAchievements = await db
    .select({ badgeId: achievements.badgeId })
    .from(achievements)
    .where(eq(achievements.userId, userId))
    .orderBy(desc(achievements.earnedAt));

  const earned = new Set(existingAchievements.map((a) => a.badgeId));

  // Find the current session
  const currentSession = allSessions.find((s) => s.id === sessionId);

  const toUnlock: Array<{ badgeId: string; context: Record<string, unknown> | null }> = [];

  // AC-002: First Quiz — any completed session
  if (!earned.has("first-quiz")) {
    toUnlock.push({ badgeId: "first-quiz", context: null });
  }

  // AC-003: Perfect Score — 100% with ≥5 questions
  if (!earned.has("perfect-score") && currentSession) {
    if (currentSession.percentage === 100 && currentSession.questionCount >= 5) {
      toUnlock.push({ badgeId: "perfect-score", context: null });
    }
  }

  // AC-005: Centurion — cumulative answered questions ≥ 100
  if (!earned.has("centurion")) {
    const totalQuestions = allSessions.reduce((sum, s) => sum + s.questionCount, 0);
    if (totalQuestions >= 100) {
      toUnlock.push({ badgeId: "centurion", context: null });
    }
  }

  // AC-004: Class Master — 7 distinct drugs correctly named in the same class
  if (!earned.has("class-master")) {
    const className = findClassMasterUnlock(allSessions);
    if (className) {
      toUnlock.push({ badgeId: "class-master", context: { className } });
    }
  }

  // AC-006 + AC-015: Streak Seeker — 7 consecutive UTC calendar days
  if (!earned.has("streak-seeker")) {
    const streak = computeStreakDays(allSessions.map((s) => s.completedAt));
    if (streak >= 7) {
      toUnlock.push({ badgeId: "streak-seeker", context: null });
    }
  }

  // Insert newly-unlocked badges and collect results
  const unlocked: BadgeUnlock[] = [];
  const now = new Date();

  for (const { badgeId, context } of toUnlock) {
    const result = await db
      .insert(achievements)
      .values({
        userId,
        badgeId,
        earnedAt: now,
        contextJson: context,
      })
      .onConflictDoNothing()
      .returning({ id: achievements.id, earnedAt: achievements.earnedAt });

    // Only include if insert actually succeeded (not a conflict)
    if (result.length > 0) {
      unlocked.push({ badgeId, earnedAt: result[0].earnedAt, context });
    }
  }

  return unlocked;
}

/**
 * Compute the maximum consecutive UTC calendar day streak ending at today or yesterday.
 * Uses server-side timestamps only (AC-015).
 */
export function computeStreakDays(completedAts: Date[]): number {
  if (completedAts.length === 0) return 0;

  // Get unique UTC dates as YYYY-MM-DD strings
  const utcDays = new Set(
    completedAts.map((d) => {
      const utc = new Date(d);
      return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
    }),
  );

  // Sort descending
  const sortedDays = Array.from(utcDays).sort().reverse();

  if (sortedDays.length === 0) return 0;

  // The most recent day should be today or yesterday (UTC)
  const todayUtc = toUtcDayString(new Date());
  const yesterdayUtc = toUtcDayString(new Date(Date.now() - 86400000));

  const mostRecent = sortedDays[0];
  if (mostRecent !== todayUtc && mostRecent !== yesterdayUtc) {
    // No recent activity — streak is 0
    return 0;
  }

  // Walk back counting consecutive days
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = sortedDays[i - 1];
    const curr = sortedDays[i];
    const prevDate = new Date(prev + "T00:00:00Z");
    const currDate = new Date(curr + "T00:00:00Z");
    const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break; // Gap found — streak ends
    }
  }

  return streak;
}

function toUtcDayString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/**
 * AC-004 helper: find the first class where the user has correctly named
 * CLASS_MASTER_DRUGS_REQUIRED distinct drugs across all their sessions.
 *
 * Uses correctly-answered `name-the-class` MC questions as the signal:
 * each such answer is ground truth (drug, class). Other quiz types are
 * ignored for this badge to keep the rule simple and auditable.
 *
 * Returns the class name on unlock, or null.
 */
export function findClassMasterUnlock(
  sessions: Array<{ quizType: string; answersJson: unknown }>,
): string | null {
  const classToDrugs = new Map<string, Set<string>>();

  for (const session of sessions) {
    if (session.quizType !== "name-the-class" && session.quizType !== "quick-5") continue;
    const answers = session.answersJson;
    if (!Array.isArray(answers)) continue;

    for (const answer of answers) {
      if (!answer || typeof answer !== "object") continue;
      const a = answer as {
        correct?: unknown;
        question?: { kind?: unknown; drugName?: unknown; correctAnswer?: unknown };
      };
      if (a.correct !== true) continue;
      const q = a.question;
      if (!q || q.kind !== "multiple-choice") continue;
      if (typeof q.drugName !== "string" || typeof q.correctAnswer !== "string") continue;

      const drug = q.drugName.trim();
      const className = q.correctAnswer.trim();
      if (!drug || !className) continue;

      const drugs = classToDrugs.get(className) ?? new Set<string>();
      drugs.add(drug);
      classToDrugs.set(className, drugs);

      if (drugs.size >= CLASS_MASTER_DRUGS_REQUIRED) {
        return className;
      }
    }
  }

  return null;
}
