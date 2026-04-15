import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

/**
 * Tests for useAchievements hook.
 * Spec: specs/achievements-badges.md AC-009, AC-010, AC-011, AC-016
 */

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useAuth hook
vi.mock("./useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "./useAuth";
import { useAchievements } from "./useAchievements";

const STORAGE_KEY = "rxdrill:achievements:v1";

function clearAchievementStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

beforeEach(() => {
  vi.resetAllMocks();
  clearAchievementStorage();
});

afterEach(() => {
  clearAchievementStorage();
});

// ──────────────────────────────────────────────
// AC-009: Authenticated path — fetch from API
// ──────────────────────────────────────────────
describe("AC-009: authenticated badge fetching", () => {
  beforeEach(() => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { sub: "user-123" },
      isLoading: false,
    });
  });

  it("should fetch achievements from API when authenticated", async () => {
    const mockBadges = [
      { badgeId: "first-quiz", earnedAt: "2026-04-14T12:00:00Z", context: null },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBadges),
    });

    const { result } = renderHook(() => useAchievements());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/achievements", expect.objectContaining({
      credentials: "include",
    }));
  });

  it("should check for new badges after a session save", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useAchievements());
    await act(async () => { await Promise.resolve(); });

    // Mock the check endpoint response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        unlocked: [{ badgeId: "first-quiz", earnedAt: "2026-04-14T12:00:00Z", context: null }],
      }),
    });

    let unlocked: { badgeId: string }[] = [];
    await act(async () => {
      unlocked = await result.current.checkAfterSession("sess-1");
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/achievements/check",
      expect.objectContaining({ method: "POST" }),
    );
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0]?.badgeId).toBe("first-quiz");
  });
});

// ──────────────────────────────────────────────
// AC-010: Guest path — localStorage
// ──────────────────────────────────────────────
describe("AC-010: guest localStorage path", () => {
  beforeEach(() => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  });

  it("should read achievements from localStorage when not authenticated", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      "first-quiz": "2026-04-13T10:00:00Z",
    }));

    const { result } = renderHook(() => useAchievements());
    expect(result.current.earnedBadges.some((b) => b.badgeId === "first-quiz")).toBe(true);
  });

  it("should return empty array when localStorage is empty", () => {
    const { result } = renderHook(() => useAchievements());
    expect(result.current.earnedBadges).toHaveLength(0);
  });

  it("should gracefully handle malformed localStorage data", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{{{");
    const { result } = renderHook(() => useAchievements());
    expect(result.current.earnedBadges).toHaveLength(0);
  });

  it("should save a guest badge to localStorage", async () => {
    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      result.current.saveGuestBadge("first-quiz", new Date("2026-04-14T10:00:00Z"));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored["first-quiz"]).toBeDefined();
  });
});

// ──────────────────────────────────────────────
// AC-011: Guest → auth migration
// ──────────────────────────────────────────────
describe("AC-011: guest → auth migration", () => {
  it("should migrate localStorage badges to API on sign-in", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      "first-quiz": "2026-04-13T10:00:00Z",
    }));

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ imported: 1, skipped: 0 }),
    });

    // First render as guest
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await result.current.migrateGuestBadges();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/achievements/migrate",
      expect.objectContaining({ method: "POST" }),
    );
    // localStorage should be cleared after successful migration
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("should NOT clear localStorage if migration API call fails", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      "first-quiz": "2026-04-13T10:00:00Z",
    }));

    mockFetch.mockResolvedValue({ ok: false });

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await result.current.migrateGuestBadges();
    });

    // localStorage should NOT be cleared on failure
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});

// ──────────────────────────────────────────────
// AC-016: Network failure during check doesn't block UX
// ──────────────────────────────────────────────
describe("AC-016: network failure resilience", () => {
  beforeEach(() => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { sub: "user-123" },
      isLoading: false,
    });
  });

  it("should return empty array (not throw) when check API fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    const { result } = renderHook(() => useAchievements());
    await act(async () => { await Promise.resolve(); });

    // Make check fail
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    let unlocked: { badgeId: string }[] = [];
    await act(async () => {
      unlocked = await result.current.checkAfterSession("sess-1");
    });

    expect(unlocked).toHaveLength(0);
  });
});

describe("Edge cases — malformed localStorage and saveGuestBadge", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
  });

  it("treats malformed localStorage JSON as empty (no throw)", async () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{");
    const { result } = renderHook(() => useAchievements());
    await act(async () => { await Promise.resolve(); });
    expect(result.current.earnedBadges).toHaveLength(0);
  });

  it("saveGuestBadge persists a new badge and de-duplicates", async () => {
    const { result } = renderHook(() => useAchievements());
    await act(async () => { await Promise.resolve(); });

    const when = new Date("2026-04-14T00:00:00Z");
    await act(async () => { result.current.saveGuestBadge("first-quiz", when); });
    expect(result.current.earnedBadges.map((b) => b.badgeId)).toContain("first-quiz");

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored["first-quiz"]).toBeDefined();

    // Saving the same badge again should NOT duplicate
    await act(async () => { result.current.saveGuestBadge("first-quiz", when); });
    const count = result.current.earnedBadges.filter((b) => b.badgeId === "first-quiz").length;
    expect(count).toBe(1);
  });

  it("checkAfterSession returns [] when server responds non-OK", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1", email: "x", name: "x", avatarUrl: null },
      isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const { result } = renderHook(() => useAchievements());
    await act(async () => { await Promise.resolve(); });

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    let res: unknown[] = [{}];
    await act(async () => { res = await result.current.checkAfterSession("sess-x"); });
    expect(res).toEqual([]);
  });
});
