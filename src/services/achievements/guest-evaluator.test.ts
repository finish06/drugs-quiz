import { describe, it, expect } from "vitest";
import { evaluateGuestBadges, type GuestSession } from "./guest-evaluator";

/**
 * Tests for client-side guest badge evaluator.
 * Mirrors server logic for localStorage-backed guest sessions.
 * Spec: specs/achievements-badges.md AC-010
 */

function makeSession(opts: {
  questionCount?: number;
  correctCount?: number;
  percentage?: number;
  completedAt?: string;
}) {
  return {
    id: Math.random().toString(36).slice(2),
    quizType: "name-the-class" as const,
    questionCount: opts.questionCount ?? 10,
    correctCount: opts.correctCount ?? 8,
    percentage: opts.percentage ?? 80,
    completedAt: opts.completedAt ?? new Date().toISOString(),
  };
}

describe("AC-010: evaluateGuestBadges", () => {
  it("should unlock first-quiz on first session", () => {
    const sessions = [makeSession({})];
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).toContain("first-quiz");
  });

  it("should NOT unlock first-quiz if already earned", () => {
    const sessions = [makeSession({})];
    const existing = { "first-quiz": new Date().toISOString() };
    const result = evaluateGuestBadges(sessions, existing);
    expect(result.map((b) => b.badgeId)).not.toContain("first-quiz");
  });

  it("should unlock perfect-score on 100% with ≥5 questions", () => {
    const sessions = [makeSession({ questionCount: 5, correctCount: 5, percentage: 100 })];
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).toContain("perfect-score");
  });

  it("should NOT unlock perfect-score on 100% with <5 questions", () => {
    const sessions = [makeSession({ questionCount: 4, correctCount: 4, percentage: 100 })];
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).not.toContain("perfect-score");
  });

  it("should NOT unlock perfect-score on <100% even with ≥5 questions", () => {
    const sessions = [makeSession({ questionCount: 10, correctCount: 9, percentage: 90 })];
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).not.toContain("perfect-score");
  });

  it("should unlock centurion when total questions reach 100", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ questionCount: 10 }));
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).toContain("centurion");
  });

  it("should NOT unlock centurion when total < 100", () => {
    const sessions = [makeSession({ questionCount: 5 })];
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).not.toContain("centurion");
  });

  it("should unlock streak-seeker on 7 consecutive days", () => {
    const base = new Date();
    const sessions = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(10, 0, 0, 0);
      return makeSession({ completedAt: d.toISOString() });
    });
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).toContain("streak-seeker");
  });

  it("should NOT unlock streak-seeker on 6 consecutive days", () => {
    const base = new Date();
    const sessions = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(10, 0, 0, 0);
      return makeSession({ completedAt: d.toISOString() });
    });
    const result = evaluateGuestBadges(sessions, {});
    expect(result.map((b) => b.badgeId)).not.toContain("streak-seeker");
  });

  it("should return empty array for no sessions", () => {
    const result = evaluateGuestBadges([], {});
    expect(result).toHaveLength(0);
  });
});

import { findGuestClassMasterUnlock, CLASS_MASTER_DRUGS_REQUIRED } from "./guest-evaluator";

describe("AC-004: Class Master — findGuestClassMasterUnlock", () => {
  function mcSession(quizType: string, pairs: Array<[string, string, boolean]>): GuestSession {
    return {
      id: `s-${Math.random()}`,
      questionCount: pairs.length,
      correctCount: pairs.filter(([,, c]) => c).length,
      percentage: 100,
      completedAt: new Date().toISOString(),
      quizType,
      answersJson: pairs.map(([drug, className, correct]) => ({
        correct,
        question: { kind: "multiple-choice", drugName: drug, correctAnswer: className },
      })),
    };
  }

  it("returns null when no sessions", () => {
    expect(findGuestClassMasterUnlock([])).toBeNull();
  });

  it(`unlocks at exactly ${CLASS_MASTER_DRUGS_REQUIRED} distinct correct drugs in one class`, () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", true]);
    expect(findGuestClassMasterUnlock([mcSession("name-the-class", pairs)])).toBe("Beta Blocker");
  });

  it("does not unlock when threshold is not met", () => {
    const pairs: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED - 1 })
      .map((_, i) => [`drug-${i}`, "Beta Blocker", true]);
    expect(findGuestClassMasterUnlock([mcSession("name-the-class", pairs)])).toBeNull();
  });

  it("ignores incorrect answers and non-MC quiz types", () => {
    const wrongAnswers: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Statin", false]);
    const brandGeneric: Array<[string, string, boolean]> = Array.from({ length: CLASS_MASTER_DRUGS_REQUIRED })
      .map((_, i) => [`drug-${i}`, "Statin", true]);
    expect(findGuestClassMasterUnlock([
      mcSession("name-the-class", wrongAnswers),
      mcSession("brand-generic-match", brandGeneric),
    ])).toBeNull();
  });

  it("tolerates sessions without answersJson", () => {
    const session: GuestSession = {
      id: "s-1", questionCount: 0, correctCount: 0, percentage: 0,
      completedAt: new Date().toISOString(), quizType: "name-the-class",
    };
    expect(findGuestClassMasterUnlock([session])).toBeNull();
  });
});
