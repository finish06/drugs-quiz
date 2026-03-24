import { describe, it, expect, beforeAll } from "vitest";
import { signJwt, verifyJwt, setSecretKeyForTest } from "./jwt.js";
import type { JwtPayload } from "./jwt.js";

const TEST_SECRET = "test-secret-key-that-is-at-least-32-chars-long";

beforeAll(() => {
  setSecretKeyForTest(TEST_SECRET);
});

describe("AC-004: JWT sign and verify", () => {
  const payload: JwtPayload = {
    sub: "user-uuid-123",
    email: "test@example.com",
    name: "Test User",
  };

  it("should sign a JWT and return a string token", async () => {
    const token = await signJwt(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("should verify a valid JWT and return the payload", async () => {
    const token = await signJwt(payload);
    const result = await verifyJwt(token);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe("user-uuid-123");
    expect(result!.email).toBe("test@example.com");
    expect(result!.name).toBe("Test User");
  });

  it("should return null for an invalid token", async () => {
    const result = await verifyJwt("invalid.token.here");
    expect(result).toBeNull();
  });

  it("should return null for a token signed with a different secret", async () => {
    const token = await signJwt(payload);
    setSecretKeyForTest("different-secret-key-that-is-also-32-chars");
    const result = await verifyJwt(token);
    expect(result).toBeNull();
    // Restore original secret
    setSecretKeyForTest(TEST_SECRET);
  });

  it("should return null for an empty token", async () => {
    const result = await verifyJwt("");
    expect(result).toBeNull();
  });
});
