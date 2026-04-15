import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Hono } from "hono";
import { signJwt } from "../auth/jwt.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";
const originalSecret = process.env.JWT_SECRET;

// Mock the database module
vi.mock("../db/index.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock the evaluator — for route tests we just test the HTTP layer
vi.mock("../services/achievements/evaluator.js", () => ({
  evaluateBadges: vi.fn(),
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

const { createAchievementsRouter } = await import("./achievements.js");
const { evaluateBadges } = await import("../services/achievements/evaluator.js");
const { db } = await import("../db/index.js");

function createTestApp() {
  const app = new Hono();
  app.route("/api/achievements", createAchievementsRouter());
  return app;
}

// ──────────────────────────────────────────────
// GET /api/achievements — AC-009
// ──────────────────────────────────────────────
describe("GET /api/achievements — AC-009", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/achievements");
    expect(res.status).toBe(401);
  });

  it("should return empty array for user with no achievements", async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  it("should return earned badges with correct shape", async () => {
    const now = new Date("2026-04-14T12:00:00Z");
    const mockData = [
      { badgeId: "first-quiz", earnedAt: now, contextJson: null },
      { badgeId: "class-master", earnedAt: now, contextJson: { className: "Beta Blocker" } },
    ];
    const mockOrderBy = vi.fn().mockResolvedValue(mockData);
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements", {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty("badgeId", "first-quiz");
    expect(body[0]).toHaveProperty("earnedAt");
    expect(body[0]).toHaveProperty("context", null);
    expect(body[1].context).toEqual({ className: "Beta Blocker" });
  });
});

// ──────────────────────────────────────────────
// POST /api/achievements/check — AC-007, AC-008
// ──────────────────────────────────────────────
describe("POST /api/achievements/check — AC-007, AC-008", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/achievements/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "sess-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 400 if sessionId missing", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("should return newly unlocked badges on happy path", async () => {
    const now = new Date("2026-04-14T12:00:00Z");
    (evaluateBadges as ReturnType<typeof vi.fn>).mockResolvedValue([
      { badgeId: "first-quiz", earnedAt: now, context: null },
    ]);

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ sessionId: "sess-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("unlocked");
    expect(body.unlocked).toHaveLength(1);
    expect(body.unlocked[0].badgeId).toBe("first-quiz");
  });

  it("should return empty unlocked array when no new badges (AC-008: idempotent)", async () => {
    (evaluateBadges as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ sessionId: "sess-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unlocked).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// POST /api/achievements/migrate — AC-011
// ──────────────────────────────────────────────
describe("POST /api/achievements/migrate — AC-011", () => {
  it("should return 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/achievements/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badges: [] }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 400 for missing badges array", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("should return 400 for unknown badgeId", async () => {
    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        badges: [{ badgeId: "not-a-real-badge", earnedAt: new Date().toISOString() }],
      }),
    });
    expect(res.status).toBe(400);
  });

  it("should successfully import valid badges (idempotent via ON CONFLICT DO NOTHING)", async () => {
    // Mock insert to return row (new insert)
    const mockOnConflict = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: "ach-1" }]),
    });
    const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockValues });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        badges: [
          { badgeId: "first-quiz", earnedAt: new Date().toISOString() },
          { badgeId: "perfect-score", earnedAt: new Date().toISOString() },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("imported");
    expect(body).toHaveProperty("skipped");
    expect(body.imported + body.skipped).toBe(2);
  });

  it("should count skipped when badge already exists (ON CONFLICT DO NOTHING returns [])", async () => {
    // Mock insert to return nothing (conflict, badge already exists)
    const mockOnConflict = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    });
    const mockValues = vi.fn().mockReturnValue({ onConflictDoNothing: mockOnConflict });
    (db.insert as ReturnType<typeof vi.fn>).mockReturnValue({ values: mockValues });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/achievements/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        badges: [{ badgeId: "first-quiz", earnedAt: new Date().toISOString() }],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(1);
    expect(body.imported).toBe(0);
  });
});
