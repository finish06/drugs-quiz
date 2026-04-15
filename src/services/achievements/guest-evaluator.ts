/**
 * Client-side guest badge evaluator.
 * Mirrors the server evaluateBadges logic for localStorage-backed guests.
 * Spec: specs/achievements-badges.md AC-010
 *
 * NOTE: This is only called for unauthenticated guests. Authenticated users
 * use POST /api/achievements/check (server is authoritative).
 */

export const CLASS_MASTER_DRUGS_REQUIRED = 7;

export interface GuestSession {
  id: string;
  questionCount: number;
  correctCount: number;
  percentage: number;
  completedAt: string; // ISO string (UTC from server or local save)
  quizType?: string;
  answersJson?: unknown;
}

export interface GuestBadgeUnlock {
  badgeId: string;
  earnedAt: Date;
  context: Record<string, unknown> | null;
}

/**
 * Evaluate which new badges a guest user earns given all their sessions.
 * @param sessions All local sessions (newest first or any order)
 * @param existing Map of already-earned badge IDs to earnedAt ISO strings
 */
export function evaluateGuestBadges(
  sessions: GuestSession[],
  existing: Record<string, string>,
): GuestBadgeUnlock[] {
  if (sessions.length === 0) return [];

  const earned = new Set(Object.keys(existing));
  const now = new Date();
  const unlocked: GuestBadgeUnlock[] = [];

  // AC-002: First Quiz
  if (!earned.has("first-quiz")) {
    unlocked.push({ badgeId: "first-quiz", earnedAt: now, context: null });
  }

  // AC-003: Perfect Score — current logic checks most-recent 100% session with ≥5 questions
  if (!earned.has("perfect-score")) {
    const perfectSession = sessions.find(
      (s) => s.percentage === 100 && s.questionCount >= 5,
    );
    if (perfectSession) {
      unlocked.push({ badgeId: "perfect-score", earnedAt: now, context: null });
    }
  }

  // AC-005: Centurion — cumulative questions ≥ 100
  if (!earned.has("centurion")) {
    const total = sessions.reduce((sum, s) => sum + s.questionCount, 0);
    if (total >= 100) {
      unlocked.push({ badgeId: "centurion", earnedAt: now, context: null });
    }
  }

  // AC-004: Class Master — 7 distinct drugs correctly named in the same class
  if (!earned.has("class-master")) {
    const className = findGuestClassMasterUnlock(sessions);
    if (className) {
      unlocked.push({ badgeId: "class-master", earnedAt: now, context: { className } });
    }
  }

  // AC-006: Streak Seeker — 7 consecutive UTC calendar days
  if (!earned.has("streak-seeker")) {
    const streak = computeGuestStreakDays(sessions.map((s) => new Date(s.completedAt)));
    if (streak >= 7) {
      unlocked.push({ badgeId: "streak-seeker", earnedAt: now, context: null });
    }
  }

  return unlocked;
}

function computeGuestStreakDays(completedAts: Date[]): number {
  if (completedAts.length === 0) return 0;

  const utcDays = new Set(
    completedAts.map((d) => {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }),
  );

  const sortedDays = Array.from(utcDays).sort().reverse();
  if (sortedDays.length === 0) return 0;

  const todayUtc = toUtcDayString(new Date());
  const yesterdayUtc = toUtcDayString(new Date(Date.now() - 86400000));

  const mostRecent = sortedDays[0];
  if (mostRecent !== todayUtc && mostRecent !== yesterdayUtc) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00Z");
    const curr = new Date(sortedDays[i] + "T00:00:00Z");
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function toUtcDayString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function findGuestClassMasterUnlock(sessions: GuestSession[]): string | null {
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
