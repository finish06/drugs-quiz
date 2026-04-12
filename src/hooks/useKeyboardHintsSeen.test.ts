import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardHintsSeen } from "./useKeyboardHintsSeen";

const SEEN_KEY = "dq-kbd-hints-seen";

beforeEach(() => {
  localStorage.clear();
});

describe("useKeyboardHintsSeen", () => {
  it("returns hasSeen=false on first visit", () => {
    const { result } = renderHook(() => useKeyboardHintsSeen());
    expect(result.current.hasSeen).toBe(false);
  });

  it("returns hasSeen=true when flag is set in localStorage", () => {
    localStorage.setItem(SEEN_KEY, "true");
    const { result } = renderHook(() => useKeyboardHintsSeen());
    expect(result.current.hasSeen).toBe(true);
  });

  it("markSeen updates state and localStorage", () => {
    const { result } = renderHook(() => useKeyboardHintsSeen());
    expect(result.current.hasSeen).toBe(false);

    act(() => {
      result.current.markSeen();
    });

    expect(result.current.hasSeen).toBe(true);
    expect(localStorage.getItem(SEEN_KEY)).toBe("true");
  });
});
