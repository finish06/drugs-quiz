import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Hono } from "hono";
import { signJwt } from "../auth/jwt.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";
const originalSecret = process.env.JWT_SECRET;

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn(),
    execute: vi.fn(),
  },
}));

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

afterAll(() => {
  if (originalSecret !== undefined) {
    process.env.JWT_SECRET = originalSecret;
  } else {
    delete process.env.JWT_SECRET;
  }
});

async function getAuthCookie(userId = "user-123") {
  const token = await signJwt({ sub: userId, email: "test@example.com", name: "Test User" });
  return `auth_token=${token}`;
}

const { createStatsRouter } = await import("./stats.js");

function createTestApp() {
  const app = new Hono();
  app.route("/api/stats", createStatsRouter());
  return app;
}

describe("GET /api/stats — AC-014, AC-021, AC-022", () => {
  it("AC-021: returns 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/stats");
    expect(res.status).toBe(401);
  });

  async function mockDbSessions(sessions: Array<Record<string, unknown>>) {
    const { db } = await import("../db/index.js");
    const mockOrderBy = vi.fn().mockResolvedValue(sessions);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });
  }

  it("AC-014: returns stats for authenticated user", async () => {
    await mockDbSessions([
      {
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: new Date(),
        answersJson: [],
      },
    ]);

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/stats", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("overallAccuracy");
    expect(body).toHaveProperty("totalQuizzes");
    expect(body).toHaveProperty("totalQuestions");
    expect(body).toHaveProperty("currentStreak");
    expect(body).toHaveProperty("quizTypeBreakdown");
    expect(body).toHaveProperty("trendData");
  });

  it("AC-022: accepts days query param", async () => {
    await mockDbSessions([
      {
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 7,
        percentage: 70,
        completedAt: new Date(),
        answersJson: [],
      },
    ]);

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/stats?days=7", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
  });

  it("AC-020: returns empty stats for user with no sessions", async () => {
    await mockDbSessions([]);

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/stats", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.overallAccuracy).toBe(0);
    expect(body.totalQuizzes).toBe(0);
    expect(body.currentStreak).toBe(0);
  });
});
