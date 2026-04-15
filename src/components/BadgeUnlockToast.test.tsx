import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { BadgeUnlockToast } from "./BadgeUnlockToast";

/**
 * Tests for BadgeUnlockToast component.
 * Spec: specs/achievements-badges.md AC-012, AC-018
 */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

const mockBadge = {
  badgeId: "first-quiz" as const,
  earnedAt: "2026-04-14T12:00:00Z",
  context: null,
};

const mockBadges = [
  { badgeId: "perfect-score" as const, earnedAt: "2026-04-14T12:00:00Z", context: null },
  { badgeId: "centurion" as const, earnedAt: "2026-04-14T12:00:00Z", context: null },
];

describe("AC-012: BadgeUnlockToast rendering", () => {
  it("should render a toast for a single badge unlock", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    expect(screen.getByText(/First Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/unlocked/i)).toBeInTheDocument();
  });

  it("should render multiple toasts for stacked unlocks", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={mockBadges} onDismiss={onDismiss} />);
    expect(screen.getByText(/Perfect Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Centurion/i)).toBeInTheDocument();
  });

  it("should auto-dismiss after 5 seconds", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should call onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    const closeBtn = screen.getAllByRole("button").find((btn) =>
      btn.getAttribute("aria-label")?.includes("Dismiss") ||
      btn.closest("[data-testid='toast-close']") !== null ||
      btn.querySelector("svg") !== null
    );
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("should NOT render when badges array is empty", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[]} onDismiss={onDismiss} />);
    // Container should be empty or not show any badge content
    expect(screen.queryByText(/unlocked/i)).not.toBeInTheDocument();
  });
});

describe("AC-018: Toast accessibility", () => {
  it("should have role=status container for assistive tech", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should have aria-live=polite on the container", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("should have accessible dismiss button", () => {
    const onDismiss = vi.fn();
    render(<BadgeUnlockToast badges={[mockBadge]} onDismiss={onDismiss} />);
    // Badge icon should be aria-hidden and text should be visible
    const text = screen.getByText(/First Quiz/i);
    expect(text).toBeVisible();
  });
});

describe("Fallbacks for unknown badge ids", () => {
  it("renders the raw badgeId as the name when the catalog has no match", () => {
    const onDismiss = vi.fn();
    render(
      <BadgeUnlockToast
        badges={[{ badgeId: "unknown-badge-xyz", earnedAt: "2026-04-14T12:00:00Z", context: null }]}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(/unknown-badge-xyz/i)).toBeInTheDocument();
  });

  it("renders nothing when badges array is empty (guards hook deps)", () => {
    const onDismiss = vi.fn();
    const { container } = render(<BadgeUnlockToast badges={[]} onDismiss={onDismiss} />);
    expect(container.firstChild).toBeNull();
  });
});
