import { renderHook, act } from "@testing-library/react";
import { useSessionHistory } from "./useSessionHistory";
import type { SessionRecord } from "@/types/quiz";

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `session-${Date.now()}-${Math.random()}`,
    completedAt: new Date().toISOString(),
    quizType: "name-the-class",
    questionCount: 10,
    correctCount: 7,
    percentage: 70,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("AC-001: Save session to localStorage", () => {
  it("should save a session record after quiz completion", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ percentage: 80 }));
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0]?.percentage).toBe(80);
  });

  it("should persist to localStorage", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession());
    });

    const stored = JSON.parse(localStorage.getItem("dq-session-history") ?? "[]");
    expect(stored).toHaveLength(1);
  });
});

describe("AC-003: Reverse chronological order", () => {
  it("should display sessions newest first", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ completedAt: "2026-03-01T10:00:00Z", percentage: 60 }));
    });
    act(() => {
      result.current.saveSession(makeSession({ completedAt: "2026-03-02T10:00:00Z", percentage: 80 }));
    });

    expect(result.current.sessions[0]?.percentage).toBe(80);
    expect(result.current.sessions[1]?.percentage).toBe(60);
  });
});

describe("AC-005: Personal best per quiz type", () => {
  it("should compute highest percentage per quiz type", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 70 }));
    });
    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 90 }));
    });
    act(() => {
      result.current.saveSession(makeSession({ quizType: "match-drug-to-class", percentage: 60 }));
    });

    expect(result.current.personalBest["name-the-class"]).toBe(90);
    expect(result.current.personalBest["match-drug-to-class"]).toBe(60);
  });
});

describe("AC-006: Personal best updates on new high score", () => {
  it("should update when a higher score is achieved", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 70 }));
    });
    expect(result.current.personalBest["name-the-class"]).toBe(70);

    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 90 }));
    });
    expect(result.current.personalBest["name-the-class"]).toBe(90);
  });

  it("should not decrease when a lower score is achieved", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 90 }));
    });
    act(() => {
      result.current.saveSession(makeSession({ quizType: "name-the-class", percentage: 50 }));
    });

    expect(result.current.personalBest["name-the-class"]).toBe(90);
  });
});

describe("AC-007: Maximum 10 sessions with eviction", () => {
  it("should keep only 10 sessions, evicting oldest", () => {
    const { result } = renderHook(() => useSessionHistory());

    for (let i = 0; i < 11; i++) {
      act(() => {
        result.current.saveSession(
          makeSession({
            id: `session-${i}`,
            completedAt: new Date(2026, 2, 1 + i).toISOString(),
            percentage: (i + 1) * 8,
          }),
        );
      });
    }

    expect(result.current.sessions).toHaveLength(10);
    // Oldest (session-0) should be evicted
    expect(result.current.sessions.find((s) => s.id === "session-0")).toBeUndefined();
    // Newest (session-10) should be present
    expect(result.current.sessions[0]?.id).toBe("session-10");
  });
});

describe("AC-008: Empty state", () => {
  it("should return empty sessions array when no history", () => {
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.sessions).toHaveLength(0);
  });
});

describe("AC-009: Collapse state persistence", () => {
  it("should default to expanded (not collapsed)", () => {
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.isCollapsed).toBe(false);
  });

  it("should toggle collapsed state", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(result.current.isCollapsed).toBe(true);
  });

  it("should persist collapse state to localStorage", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(localStorage.getItem("dq-history-collapsed")).toBe("true");
  });

  it("should restore collapse state from localStorage", () => {
    localStorage.setItem("dq-history-collapsed", "true");
    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.isCollapsed).toBe(true);
  });
});

describe("AC-010: Survives page reload", () => {
  it("should restore sessions from localStorage on mount", () => {
    const sessions = [makeSession({ percentage: 85 })];
    localStorage.setItem("dq-session-history", JSON.stringify(sessions));

    const { result } = renderHook(() => useSessionHistory());
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0]?.percentage).toBe(85);
  });
});

describe("Edge: Session with 0 questions", () => {
  it("should not save sessions with 0 questions", () => {
    const { result } = renderHook(() => useSessionHistory());

    act(() => {
      result.current.saveSession(makeSession({ questionCount: 0 }));
    });

    expect(result.current.sessions).toHaveLength(0);
  });
});
