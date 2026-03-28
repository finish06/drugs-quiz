import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionHistory } from "./useSessionHistory";

// Mock useAuth
vi.mock("./useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

const HISTORY_KEY = "dq-session-history";

function makeSessions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `session-${i}`,
    completedAt: new Date(Date.now() - i * 60000).toISOString(),
    quizType: "name-the-class" as const,
    questionCount: 10,
    correctCount: 8 - i,
    percentage: (8 - i) * 10,
  }));
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useSessionHistory — localStorage mode (unauthenticated)", () => {
  it("AC-016: reads sessions from localStorage when unauthenticated", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(3)));
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.sessions).toHaveLength(3);
  });

  it("saves a new session to localStorage", () => {
    const { result } = renderHook(() => useSessionHistory());
    act(() => {
      result.current.saveSession({
        id: "new-1",
        completedAt: new Date().toISOString(),
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 7,
        percentage: 70,
      });
    });
    expect(result.current.sessions).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY)!)).toHaveLength(1);
  });

  it("AC-018: computes personal best per quiz type", () => {
    const sessions = [
      { ...makeSessions(1)[0], quizType: "name-the-class" as const, percentage: 90 },
      { ...makeSessions(1)[0], id: "s2", quizType: "name-the-class" as const, percentage: 70 },
      { ...makeSessions(1)[0], id: "s3", quizType: "quick-5" as const, percentage: 100 },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.personalBest["name-the-class"]).toBe(90);
    expect(result.current.personalBest["quick-5"]).toBe(100);
  });

  it("limits to MAX_SESSIONS (10)", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(10)));
    const { result } = renderHook(() => useSessionHistory());
    act(() => {
      result.current.saveSession({
        id: "overflow",
        completedAt: new Date().toISOString(),
        quizType: "quick-5",
        questionCount: 5,
        correctCount: 5,
        percentage: 100,
      });
    });
    expect(result.current.sessions).toHaveLength(10);
  });

  it("skips sessions with questionCount 0", () => {
    const { result } = renderHook(() => useSessionHistory());
    act(() => {
      result.current.saveSession({
        id: "empty",
        completedAt: new Date().toISOString(),
        quizType: "name-the-class",
        questionCount: 0,
        correctCount: 0,
        percentage: 0,
      });
    });
    expect(result.current.sessions).toHaveLength(0);
  });

  it("toggles collapsed state", () => {
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.isCollapsed).toBe(false);
    act(() => {
      result.current.toggleCollapsed();
    });
    expect(result.current.isCollapsed).toBe(true);
  });

  it("returns hasLocalSessions flag", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(2)));
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.hasLocalSessions).toBe(true);
  });

  it("returns localSessionCount", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(4)));
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.localSessionCount).toBe(4);
  });

  it("clearLocalSessions removes localStorage data", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(3)));
    const { result } = renderHook(() => useSessionHistory());
    act(() => {
      result.current.clearLocalSessions();
    });
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });
});

describe("useSessionHistory — API mode (authenticated)", () => {
  async function setupAuth() {
    const { useAuth } = await import("./useAuth");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "user-1", email: "test@test.com", name: "Test", avatarUrl: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
  }

  it("AC-015: fetches sessions from API when authenticated", async () => {
    await setupAuth();

    const mockSessions = makeSessions(2);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessions: mockSessions }),
    });

    const { result } = renderHook(() => useSessionHistory());

    await vi.waitFor(() => {
      expect(result.current.sessions).toHaveLength(2);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/sessions?limit=10", expect.any(Object));
  });

  it("falls back to localStorage when API fetch fails", async () => {
    await setupAuth();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(makeSessions(3)));

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSessionHistory());

    await vi.waitFor(() => {
      expect(result.current.sessions).toHaveLength(3);
    });
  });

  it("saves session to API when authenticated", async () => {
    await setupAuth();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessions: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "server-1" }) });

    const { result } = renderHook(() => useSessionHistory());

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.saveSession({
        id: "local-1",
        completedAt: new Date().toISOString(),
        quizType: "name-the-class",
        questionCount: 10,
        correctCount: 7,
        percentage: 70,
      });
    });

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Does NOT write to localStorage when authenticated
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it("tracks lastSavedSessionId from API response", async () => {
    await setupAuth();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessions: [] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: "server-session-abc" }) });

    const { result } = renderHook(() => useSessionHistory());

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.saveSession({
        id: "local-1",
        completedAt: new Date().toISOString(),
        quizType: "quick-5",
        questionCount: 5,
        correctCount: 5,
        percentage: 100,
      });
    });

    await vi.waitFor(() => {
      expect(result.current.lastSavedSessionId).toBe("server-session-abc");
    });
  });

  it("returns hasLocalSessions=false when no localStorage data", () => {
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.hasLocalSessions).toBe(false);
    expect(result.current.localSessionCount).toBe(0);
  });
});
