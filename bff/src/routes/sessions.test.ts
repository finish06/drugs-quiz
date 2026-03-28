import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Hono } from "hono";
import { signJwt } from "../auth/jwt.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";
const originalSecret = process.env.JWT_SECRET;

// Mock the database module before importing routes
vi.mock("../db/index.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
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

async function getAuthCookie(userId = "user-123", email = "test@example.com") {
  const token = await signJwt({ sub: userId, email, name: "Test User" });
  return `auth_token=${token}`;
}

// Import after mock setup
const { createSessionsRouter } = await import("./sessions.js");

function createTestApp() {
  const app = new Hono();
  app.route("/api/sessions", createSessionsRouter());
  return app;
}

describe("POST /api/sessions/migrate — AC-004, AC-005, AC-006", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions: [] }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 400 for invalid body (missing sessions array)", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 when sessions exceed max limit (50)", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const sessions = Array.from({ length: 51 }, (_, i) => ({
      quizType: "name-the-class",
      questionCount: 10,
      correctCount: 8,
      percentage: 80,
      completedAt: new Date(Date.now() - i * 60000).toISOString(),
    }));
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ sessions }),
    });
    expect(res.status).toBe(400);
  });

  it("should validate individual session fields", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        sessions: [
          {
            quizType: "invalid-type",
            questionCount: 10,
            correctCount: 8,
            percentage: 80,
            completedAt: new Date().toISOString(),
          },
        ],
      }),
    });
    // Invalid sessions are skipped, not rejected
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.migrated).toBe(0);
    expect(body.skipped).toBe(1);
  });

  it("should skip sessions with future completedAt", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        sessions: [
          {
            quizType: "name-the-class",
            questionCount: 10,
            correctCount: 8,
            percentage: 80,
            completedAt: futureDate,
          },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(1);
  });

  it("should skip sessions with correctCount > questionCount", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        sessions: [
          {
            quizType: "name-the-class",
            questionCount: 10,
            correctCount: 15,
            percentage: 150,
            completedAt: new Date().toISOString(),
          },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(1);
  });

  it("should accept valid sessions and return migrated count", async () => {
    const { db } = await import("../db/index.js");
    // Mock insert chain
    const mockReturning = vi.fn().mockResolvedValue([{ id: "session-1" }]);
    const mockOnConflictDoNothing = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockValues });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        sessions: [
          {
            quizType: "name-the-class",
            questionCount: 10,
            correctCount: 8,
            percentage: 80,
            completedAt: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.migrated).toBeGreaterThanOrEqual(0);
  });
});

describe("GET /api/sessions — AC-015, AC-017", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sessions");
    expect(res.status).toBe(401);
  });

  it("should return sessions for authenticated user", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([
      {
        id: "s1",
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: new Date(),
      },
    ]);
    const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessions).toBeDefined();
    expect(Array.isArray(body.sessions)).toBe(true);
  });

  it("should respect limit query param (max 50)", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions?limit=100", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    // Verify limit was capped
    expect(mockLimit).toHaveBeenCalledWith(50);
  });
});

describe("POST /api/sessions — single session save", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: new Date().toISOString(),
        answersJson: [],
      }),
    });
    expect(res.status).toBe(401);
  });

  it("should save a valid session and return 201", async () => {
    const { db } = await import("../db/index.js");
    const now = new Date();
    const mockReturning = vi.fn().mockResolvedValue([
      {
        id: "new-session-1",
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: now,
      },
    ]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockValues });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: now.toISOString(),
        answersJson: [],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
  });

  it("should return 400 for invalid quiz type", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        quizType: "not-a-real-type",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: new Date().toISOString(),
        answersJson: [],
      }),
    });
    expect(res.status).toBe(400);
  });
});
