import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTheme } from "./useTheme";

function createMatchMediaMock(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return {
    matches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    dispatchChange(newMatches: boolean) {
      listeners.forEach((cb) => cb({ matches: newMatches } as MediaQueryListEvent));
    },
  };
}

// Simple localStorage mock
function createStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe("useTheme", () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
  let storageMock: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    storageMock = createStorageMock();
    vi.stubGlobal("localStorage", storageMock);
    // Remove dark class
    document.documentElement.classList.remove("dark");
    // Default to light OS preference
    matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 'light' when OS preference is light and no localStorage", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("returns 'dark' when OS preference is dark and no localStorage", () => {
    matchMediaMock = createMatchMediaMock(true);
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("returns localStorage value when set ('dark' even if OS is light)", () => {
    storageMock.setItem("theme", "dark");

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme switches from light to dark and updates localStorage", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
    expect(storageMock.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("toggleTheme switches from dark to light and updates localStorage", () => {
    matchMediaMock = createMatchMediaMock(true);
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
    expect(storageMock.setItem).toHaveBeenCalledWith("theme", "light");
  });

  it("handles invalid localStorage value (falls back to OS preference)", () => {
    storageMock.setItem("theme", "banana");
    matchMediaMock = createMatchMediaMock(true);
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("applies 'dark' class to document.documentElement when theme is dark", () => {
    matchMediaMock = createMatchMediaMock(true);
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));

    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes 'dark' class when theme is light", () => {
    document.documentElement.classList.add("dark");

    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows OS preference change when no localStorage override", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");

    act(() => {
      matchMediaMock.dispatchChange(true);
    });

    expect(result.current.theme).toBe("dark");
  });
});
