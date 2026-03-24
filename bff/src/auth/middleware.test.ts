import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { signJwt, setSecretKeyForTest } from "./jwt.js";
import { authMiddleware } from "./middleware.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";

beforeAll(() => {
  setSecretKeyForTest(TEST_SECRET);
});

function createTestApp() {
  const app = new Hono();
  app.get("/protected", authMiddleware, (c) => {
    const user = c.get("user");
    return c.json({ userId: user.sub, email: user.email });
  });
  return app;
}

describe("AC-011: JWT auth middleware", () => {
  it("should return 401 when no auth_token cookie is present", async () => {
    const app = createTestApp();
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("should return 401 when auth_token cookie contains invalid token", async () => {
    const app = createTestApp();
    const res = await app.request("/protected", {
      headers: { Cookie: "auth_token=invalid.token.value" },
    });
    expect(res.status).toBe(401);
  });

  it("should pass through and set user context with valid token", async () => {
    const app = createTestApp();
    const token = await signJwt({
      sub: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    const res = await app.request("/protected", {
      headers: { Cookie: `auth_token=${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("user-123");
    expect(body.email).toBe("test@example.com");
  });

  it("should return 401 when token is signed with wrong secret", async () => {
    const token = await signJwt({
      sub: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    // Change the secret so verification fails
    setSecretKeyForTest("wrong-secret-key-that-is-also-32-chars-!!!");
    const app = createTestApp();
    const res = await app.request("/protected", {
      headers: { Cookie: `auth_token=${token}` },
    });
    expect(res.status).toBe(401);
    // Restore
    setSecretKeyForTest(TEST_SECRET);
  });
});
