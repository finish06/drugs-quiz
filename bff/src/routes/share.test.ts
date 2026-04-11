import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Hono } from "hono";
import { signJwt } from "../auth/jwt.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";
const originalSecret = process.env.JWT_SECRET;

vi.mock("../db/index.js", () => ({
  db: {
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

async function getAuthCookie(userId = "user-123") {
  const token = await signJwt({ sub: userId, email: "test@example.com", name: "Test User" });
  return `auth_token=${token}`;
}

const { createShareRouter, createPublicShareRouter } = await import("./share.js");

function createTestApp() {
  const app = new Hono();
  app.route("/api/sessions", createShareRouter());
  app.route("/s", createPublicShareRouter());
  return app;
}

describe("POST /api/sessions/:id/share — AC-002, AC-003, AC-015, AC-018", () => {
  it("AC-002: returns 401 without auth", async () => {
    const app = createTestApp();
    const res = await app.request("/api/sessions/session-1/share", {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("AC-015: returns 403 for session not belonging to user", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([
      { id: "session-1", userId: "other-user", shareToken: null },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie("user-123");
    const res = await app.request("/api/sessions/session-1/share", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent session", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/nonexistent/share", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });

  it("AC-018: returns existing token if already shared", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([
      { id: "session-1", userId: "user-123", shareToken: "existingTk" },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/session-1/share", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shareToken).toBe("existingTk");
    expect(body.shareUrl).toBe("/s/existingTk");
  });

  it("AC-003: generates new token and returns share URL", async () => {
    const { db } = await import("../db/index.js");
    // First call: select returns session without token
    const mockLimit = vi.fn().mockResolvedValue([
      { id: "session-1", userId: "user-123", shareToken: null },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    // Second call: update sets the token
    const mockReturning = vi.fn().mockResolvedValue([{ shareToken: "newToken1" }]);
    const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue({ set: mockSet });

    const app = createTestApp();
    const cookie = await getAuthCookie();
    const res = await app.request("/api/sessions/session-1/share", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.shareToken).toBeDefined();
    expect(body.shareUrl).toMatch(/^\/s\//);
  });
});

describe("GET /s/:token — AC-008, AC-009, AC-011, AC-016", () => {
  it("AC-016: returns 404 HTML for invalid token", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: vi.fn().mockReturnValue({ innerJoin: mockInnerJoin }) });

    const app = createTestApp();
    const res = await app.request("/s/invalidtoken");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("not found");
  });

  it("AC-008, AC-009, AC-011: returns HTML with score and OG tags for valid token", async () => {
    const { db } = await import("../db/index.js");
    const mockLimit = vi.fn().mockResolvedValue([
      {
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 8,
        percentage: 80,
        completedAt: new Date("2026-03-20T14:00:00Z"),
        userName: "Caleb",
      },
    ]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const app = createTestApp();
    const res = await app.request("/s/validtoken1");
    expect(res.status).toBe(200);
    const html = await res.text();
    // Check OG tags
    expect(html).toContain('og:title');
    expect(html).toContain("Caleb scored 80%");
    expect(html).toContain('og:description');
    expect(html).toContain("8/10 correct");
    // Check page content
    expect(html).toContain("Try Rx Drill");
    expect(html).toContain("Name the Class");
  });
});
