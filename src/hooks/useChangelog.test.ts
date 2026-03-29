import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the generated module
vi.mock("@/generated/changelog", () => ({
  changelog: [
    {
      version: "0.5.0",
      date: "March 29, 2026",
      entries: [
        { category: "new", title: "Google Sign-In", description: "Sign in with Google" },
      ],
    },
    {
      version: "0.4.0",
      date: "March 22, 2026",
      entries: [
        { category: "fix", title: "Bug fixes", description: "Various fixes" },
      ],
    },
  ],
  appVersion: "0.5.0",
}));

import { useChangelog } from "./useChangelog";

const SEEN_KEY = "dq-changelog-seen";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("useChangelog — AC-002, AC-003, AC-012, AC-013", () => {
  it("AC-002: hasUnseen is true when no last-seen version exists", () => {
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(true);
  });

  it("AC-002: hasUnseen is true when last-seen version is older", () => {
    localStorage.setItem(SEEN_KEY, "0.4.0");
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(true);
  });

  it("AC-013: hasUnseen is false when last-seen version equals current", () => {
    localStorage.setItem(SEEN_KEY, "0.5.0");
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(false);
  });

  it("hasUnseen is false when last-seen version is newer (downgrade)", () => {
    localStorage.setItem(SEEN_KEY, "0.6.0");
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(false);
  });

  it("AC-012: markSeen updates localStorage and clears hasUnseen", () => {
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(true);

    act(() => {
      result.current.markSeen();
    });

    expect(result.current.hasUnseen).toBe(false);
    expect(localStorage.getItem(SEEN_KEY)).toBe("0.5.0");
  });

  it("returns changelog data from generated module", () => {
    const { result } = renderHook(() => useChangelog());
    expect(result.current.changelog).toHaveLength(2);
    expect(result.current.changelog[0]?.version).toBe("0.5.0");
    expect(result.current.appVersion).toBe("0.5.0");
  });

  it("AC-003: reads last-seen version from localStorage", () => {
    localStorage.setItem(SEEN_KEY, "0.5.0");
    const { result } = renderHook(() => useChangelog());
    expect(result.current.hasUnseen).toBe(false);
  });
});
