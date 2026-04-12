import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock canvas-confetti (no real canvas in jsdom)
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

// Mock matchMedia for all tests (jsdom doesn't support it)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }),
});

// Mock localStorage for all tests (jsdom may not provide it reliably)
if (typeof window.localStorage === "undefined" || typeof window.localStorage.getItem !== "function") {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    writable: true,
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
    },
  });
}
