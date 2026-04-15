import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB before importing evaluator
vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { evaluateBadges } from "./evaluator.js";
import { db } from "../../db/index.js";

/**
 * Tests for the server-side badge evaluator.
 * Spec: specs/achievements-badges.md AC-002..006, AC-015, edge cases
 */

const USER_ID = "user-abc123";
const SESSION_ID = "sess-abc123";

/** Helper to create a mock quiz session */
function makeSession(opts: {
  id?: string;
  questionCount?: number;
  correctCount?: number;
  percentage?: number;
  completedAt?: Date;
  answersJson?: unknown[];
}) {
  return {
    id: opts.id ?? SESSION_ID,
    userId: USER_ID,
    questionCount: opts.questionCount ?? 10,
    correctCount: opts.correctCount ?? 8,
    percentage: opts.percentage ?? 80,
    completedAt: opts.completedAt ?? new Date(),
    answersJson: opts.answersJson ?? [],
    quizType: "name-the-class" as const,
    shareToken: null,
  };
}

/** Mock insert to succeed (for recording badge) */
function mockDbInsert() {
  (db.insert as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const mockOnConflict = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "ach-1" }]) });
    const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
    return { values: mockValues };
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ──────────────────────────────────────────────
// AC-002: First Quiz badge
// ──────────────────────────────────────────────
describe("AC-002: First Quiz badge", () => {
  it("should unlock first-quiz on first ever session", async () => {
    const session = makeSession({ id: SESSION_ID });
    // First select: all sessions (just this one). Second: existing achievements (none).
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).toContain("first-quiz");
  });

  it("should NOT unlock first-quiz if already earned", async () => {
    const session = makeSession({ id: SESSION_ID });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data =
        call === 1
          ? [session]
          : [{ badgeId: "first-quiz", earnedAt: new Date(), contextJson: null }];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("first-quiz");
  });
});

// ──────────────────────────────────────────────
// AC-003: Perfect Score badge (≥5 questions, 100%)
// ──────────────────────────────────────────────
describe("AC-003: Perfect Score badge", () => {
  it("should unlock perfect-score on 100% with 5 questions", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 5, correctCount: 5, percentage: 100 });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).toContain("perfect-score");
  });

  it("should NOT unlock perfect-score if questionCount < 5 (edge case: quiz cheese guard)", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 4, correctCount: 4, percentage: 100 });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("perfect-score");
  });

  it("should NOT unlock perfect-score on 100% with 1 question", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 1, correctCount: 1, percentage: 100 });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("perfect-score");
  });

  it("should NOT unlock perfect-score on < 100% score", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 10, correctCount: 9, percentage: 90 });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("perfect-score");
  });
});

// ──────────────────────────────────────────────
// AC-005: Centurion badge (100 cumulative questions)
// ──────────────────────────────────────────────
describe("AC-005: Centurion badge", () => {
  it("should unlock centurion when total questions reach exactly 100", async () => {
    // Previous 9 sessions of 10 questions each = 90; current session adds 10 = 100
    const prevSessions = Array.from({ length: 9 }, (_, i) =>
      makeSession({ id: `sess-prev-${i}`, questionCount: 10 }),
    );
    const currentSession = makeSession({ id: SESSION_ID, questionCount: 10 });
    const allSessions = [...prevSessions, currentSession];

    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? allSessions : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).toContain("centurion");
  });

  it("should NOT unlock centurion when total < 100", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 5 });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("centurion");
  });
});

// ──────────────────────────────────────────────
// AC-006: Streak Seeker (7 consecutive UTC calendar days)
// AC-015: Uses server timestamps only
// ──────────────────────────────────────────────
describe("AC-006 + AC-015: Streak Seeker badge", () => {
  function makeStreakSessions(days: number, baseDate?: Date): ReturnType<typeof makeSession>[] {
    const base = baseDate ?? new Date();
    // Create sessions for the last `days` consecutive days (UTC)
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(10, 0, 0, 0); // noon UTC
      return makeSession({ id: `sess-streak-${i}`, completedAt: d });
    });
  }

  it("should unlock streak-seeker on exactly 7 consecutive UTC days", async () => {
    const sessions = makeStreakSessions(7);
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? sessions : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).toContain("streak-seeker");
  });

  it("should NOT unlock streak-seeker on 6 consecutive days", async () => {
    const sessions = makeStreakSessions(6);
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? sessions : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("streak-seeker");
  });

  it("should NOT unlock streak-seeker if a day is skipped in the middle", async () => {
    // 3 days, skip, 3 days — no 7-day streak
    const base = new Date();
    const sessions: ReturnType<typeof makeSession>[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(10, 0, 0, 0);
      sessions.push(makeSession({ id: `sess-a-${i}`, completedAt: d }));
    }
    // Skip day 3, then 3 more
    for (let i = 4; i < 7; i++) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(10, 0, 0, 0);
      sessions.push(makeSession({ id: `sess-b-${i}`, completedAt: d }));
    }

    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? sessions : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("streak-seeker");
  });

  it("should unlock streak-seeker even with multiple sessions on the same day", async () => {
    // 7 days, some days have multiple sessions
    const base = new Date();
    const sessions: ReturnType<typeof makeSession>[] = [];
    for (let i = 0; i < 7; i++) {
      // 2 sessions per day
      for (let j = 0; j < 2; j++) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(10 + j, 0, 0, 0);
        sessions.push(makeSession({ id: `sess-multi-${i}-${j}`, completedAt: d }));
      }
    }

    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? sessions : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).toContain("streak-seeker");
  });
});

// ──────────────────────────────────────────────
// AC-008: Idempotency — duplicate unlock is silently ignored
// ──────────────────────────────────────────────
describe("AC-008: Idempotency — no duplicate unlocks returned", () => {
  it("should return empty unlocked array when all badges already earned", async () => {
    const session = makeSession({ id: SESSION_ID, questionCount: 5, correctCount: 5, percentage: 100 });
    const existingAchievements = [
      { badgeId: "first-quiz", earnedAt: new Date(), contextJson: null },
      { badgeId: "perfect-score", earnedAt: new Date(), contextJson: null },
    ];

    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : existingAchievements;
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    expect(unlocked.map((u) => u.badgeId)).not.toContain("first-quiz");
    expect(unlocked.map((u) => u.badgeId)).not.toContain("perfect-score");
  });
});

// ──────────────────────────────────────────────
// AC-007: Server-side evaluation returns BadgeUnlock[] shape
// ──────────────────────────────────────────────
describe("AC-007: evaluateBadges return shape", () => {
  it("should return objects with badgeId, earnedAt, and context fields", async () => {
    const session = makeSession({ id: SESSION_ID });
    let call = 0;
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      const data = call === 1 ? [session] : [];
      const chain = { orderBy: vi.fn().mockResolvedValue(data) };
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(chain) }) };
    });
    mockDbInsert();

    const unlocked = await evaluateBadges(USER_ID, SESSION_ID);
    if (unlocked.length > 0) {
      const u = unlocked[0];
      expect(u).toHaveProperty("badgeId");
      expect(u).toHaveProperty("earnedAt");
      expect(u).toHaveProperty("context");
    }
  });
});

import { findClassMasterUnlock, CLASS_MASTER_DRUGS_REQUIRED } from "./evaluator.js";

describe("AC-004: Class Master — findClassMasterUnlock", () => {
  function mcSession(quizType: string, pairs: Array<[string, string, boolean]>) {
    return {
      quizType,
      answersJson: pairs.map(([drug, className, correct]) => ({
        correct,
        question: { kind: "multiple-choice", drugName: drug, correctAnswer: className },
      })),
    };
  }

  it("returns null when no session data is present", () => {
    expect(findClassMasterUnlock([])).toBeNull();
  });

  it("returns null when fewer than the required distinct drugs are correct", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED - 1 })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", true]);
    expect(findClassMasterUnlock([mcSession("name-the-class", pairs)])).toBeNull();
  });

  it(`returns the class name when ${CLASS_MASTER_DRUGS_REQUIRED} distinct correct drugs land in one class`, () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", true]);
    expect(findClassMasterUnlock([mcSession("name-the-class", pairs)])).toBe("Beta Blocker");
  });

  it("does not count duplicate drug names within the same class", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map(() => ["same-drug", "Beta Blocker", true]);
    expect(findClassMasterUnlock([mcSession("name-the-class", pairs)])).toBeNull();
  });

  it("ignores incorrect answers", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", false]);
    expect(findClassMasterUnlock([mcSession("name-the-class", pairs)])).toBeNull();
  });

  it("ignores unrelated quiz types (e.g., brand-generic-match)", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", true]);
    expect(findClassMasterUnlock([mcSession("brand-generic-match", pairs)])).toBeNull();
  });

  it("counts name-the-class MC answers inside a quick-5 session", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "ACE Inhibitor", true]);
    expect(findClassMasterUnlock([mcSession("quick-5", pairs)])).toBe("ACE Inhibitor");
  });

  it("aggregates distinct drugs across multiple sessions", () => {
    const sessions = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED }).map((_, i) =>
      mcSession("name-the-class", [[`drug-${i}`, "Statin", true]]),
    );
    expect(findClassMasterUnlock(sessions)).toBe("Statin");
  });

  it("tolerates malformed answersJson (non-array, missing fields)", () => {
    const bad = [
      { quizType: "name-the-class", answersJson: null },
      { quizType: "name-the-class", answersJson: [{ correct: true }] },
      { quizType: "name-the-class", answersJson: [{ correct: true, question: { kind: "matching" } }] },
      { quizType: "name-the-class", answersJson: [{ correct: true, question: { kind: "multiple-choice", drugName: "", correctAnswer: "" } }] },
    ];
    expect(findClassMasterUnlock(bad)).toBeNull();
  });
});
