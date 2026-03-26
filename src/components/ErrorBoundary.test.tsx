import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

// Suppress React error boundary console noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  return () => {
    console.error = originalConsoleError;
  };
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test explosion");
  return <div>Child OK</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeVisible();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByText(/unexpected error/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /Reload/i })).toBeVisible();
  });

  it("logs the error via componentDidCatch", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("calls window.location.reload when Reload is clicked", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Reload/i }));
    expect(reloadMock).toHaveBeenCalled();
  });
});
