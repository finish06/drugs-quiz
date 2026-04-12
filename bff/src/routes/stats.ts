import { Hono } from "hono";
import { eq, desc, and, gte } from "drizzle-orm";
import { authMiddleware } from "../auth/middleware.js";
import { db } from "../db/index.js";
import { quizSessions } from "../db/schema.js";

export function createStatsRouter(): Hono {
  const router = new Hono();

  router.get("/", authMiddleware, async (c) => {
    const user = c.get("user");
    const daysParam = c.req.query("days");
    const days = daysParam ? parseInt(daysParam, 10) : null;

    const dateFilter = days
      ? and(
          eq(quizSessions.userId, user.sub),
          gte(quizSessions.completedAt, new Date(Date.now() - days * 86400000)),
        )
      : eq(quizSessions.userId, user.sub);

    // Fetch all sessions for the user (within date range if specified)
    const sessions = await db
      .select({
        quizType: quizSessions.quizType,
        questionCount: quizSessions.questionCount,
        correctCount: quizSessions.correctCount,
        percentage: quizSessions.percentage,
        completedAt: quizSessions.completedAt,
        answersJson: quizSessions.answersJson,
      })
      .from(quizSessions)
      .where(dateFilter)
      .orderBy(desc(quizSessions.completedAt));

    if (sessions.length === 0) {
      return c.json({
        overallAccuracy: 0,
        totalQuizzes: 0,
        totalQuestions: 0,
        currentStreak: 0,
        longestStreak: 0,
        quizTypeBreakdown: [],
        weakestClasses: [],
        strongestClasses: [],
        trendData: [],
      });
    }

    // Overall stats
    const totalQuizzes = sessions.length;
    const totalQuestions = sessions.reduce((s, r) => s + r.questionCount, 0);
    const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
    const overallAccuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 1000) / 10
        : 0;

    // Streak calculation
    const { currentStreak, longestStreak } = computeStreaks(sessions);

    // Quiz type breakdown
    const typeMap = new Map<string, { correct: number; total: number; count: number }>();
    for (const s of sessions) {
      const entry = typeMap.get(s.quizType) || { correct: 0, total: 0, count: 0 };
      entry.correct += s.correctCount;
      entry.total += s.questionCount;
      entry.count += 1;
      typeMap.set(s.quizType, entry);
    }
    const quizTypeBreakdown = Array.from(typeMap.entries()).map(([quizType, data]) => ({
      quizType,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 1000) / 10 : 0,
      count: data.count,
    }));

    // Class-level stats from answersJson
    const classMap = new Map<string, { correct: number; total: number }>();
    for (const s of sessions) {
      const answers = s.answersJson as Array<{
        question?: { correctAnswer?: string; kind?: string };
        correct?: boolean;
      }>;
      if (!Array.isArray(answers)) continue;
      for (const a of answers) {
        const className = a.question?.correctAnswer;
        if (!className || a.question?.kind !== "multiple-choice") continue;
        const entry = classMap.get(className) || { correct: 0, total: 0 };
        entry.total += 1;
        if (a.correct) entry.correct += 1;
        classMap.set(className, entry);
      }
    }

    const classStats = Array.from(classMap.entries())
      .map(([className, data]) => ({
        className,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 1000) / 10 : 0,
        totalSeen: data.total,
      }))
      .filter((c) => c.totalSeen >= 3); // Need at least 3 data points

    const weakestClasses = [...classStats]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const strongestClasses = [...classStats]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    // Trend data — accuracy per day
    const dayMap = new Map<string, { correct: number; total: number }>();
    for (const s of sessions) {
      const dateKey = new Date(s.completedAt).toISOString().split("T")[0]!;
      const entry = dayMap.get(dateKey) || { correct: 0, total: 0 };
      entry.correct += s.correctCount;
      entry.total += s.questionCount;
      dayMap.set(dateKey, entry);
    }
    const trendData = Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 1000) / 10 : 0,
        count: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return c.json({
      overallAccuracy,
      totalQuizzes,
      totalQuestions,
      currentStreak,
      longestStreak,
      quizTypeBreakdown,
      weakestClasses,
      strongestClasses,
      trendData,
    });
  });

  return router;
}

function computeStreaks(
  sessions: Array<{ completedAt: Date | string }>,
): { currentStreak: number; longestStreak: number } {
  // Get unique dates (YYYY-MM-DD), sorted descending
  const dates = new Set<string>();
  for (const s of sessions) {
    dates.add(new Date(s.completedAt).toISOString().split("T")[0]!);
  }
  const sortedDates = Array.from(dates).sort().reverse();

  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;

  // Current streak: count consecutive days from today or yesterday backwards
  let currentStreak = 0;
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    let expectedDate = new Date(sortedDates[0]!);
    for (const d of sortedDates) {
      const dateStr = expectedDate.toISOString().split("T")[0]!;
      if (d === dateStr) {
        currentStreak++;
        expectedDate = new Date(expectedDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let streak = 1;
  const asc = [...sortedDates].reverse();
  for (let i = 1; i < asc.length; i++) {
    const prev = new Date(asc[i - 1]!).getTime();
    const curr = new Date(asc[i]!).getTime();
    if (curr - prev === 86400000) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return { currentStreak, longestStreak };
}
