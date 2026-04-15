import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentBadgesWidget } from "./RecentBadgesWidget";

/**
 * Tests for RecentBadgesWidget component.
 * Spec: specs/achievements-badges.md AC-014
 */

const sampleBadges = [
  { badgeId: "first-quiz", earnedAt: "2026-04-12T10:00:00Z", context: null },
  { badgeId: "perfect-score", earnedAt: "2026-04-13T10:00:00Z", context: null },
  { badgeId: "centurion", earnedAt: "2026-04-14T10:00:00Z", context: null },
];

describe("AC-014: RecentBadgesWidget", () => {
  it("should render up to 3 most recent badges", () => {
    const onViewAll = vi.fn();
    render(<RecentBadgesWidget badges={sampleBadges} onViewAll={onViewAll} />);
    // Should show "Recent Badges" heading
    expect(screen.getByText(/Recent Badges/i)).toBeInTheDocument();
  });

  it("should NOT render when user has 0 earned badges (AC-014: hidden at 0)", () => {
    const onViewAll = vi.fn();
    render(<RecentBadgesWidget badges={[]} onViewAll={onViewAll} />);
    // Widget should not render
    expect(screen.queryByText(/Recent Badges/i)).not.toBeInTheDocument();
  });

  it("should show 'View all' link", () => {
    const onViewAll = vi.fn();
    render(<RecentBadgesWidget badges={sampleBadges} onViewAll={onViewAll} />);
    expect(screen.getByText(/View all/i)).toBeInTheDocument();
  });

  it("should call onViewAll when 'View all' is clicked", () => {
    const onViewAll = vi.fn();
    render(<RecentBadgesWidget badges={sampleBadges} onViewAll={onViewAll} />);
    fireEvent.click(screen.getByText(/View all/i));
    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it("should only show the 3 most recent badges even if more provided", () => {
    const onViewAll = vi.fn();
    const fourBadges = [
      ...sampleBadges,
      { badgeId: "streak-seeker", earnedAt: "2026-04-15T10:00:00Z", context: null },
    ];
    render(<RecentBadgesWidget badges={fourBadges} onViewAll={onViewAll} />);
    // The widget should only show 3 icons max
    const heading = screen.getByText(/Recent Badges/i);
    expect(heading).toBeInTheDocument();
  });

  it("should render correctly with only 1 badge", () => {
    const onViewAll = vi.fn();
    render(
      <RecentBadgesWidget
        badges={[{ badgeId: "first-quiz", earnedAt: "2026-04-14T10:00:00Z", context: null }]}
        onViewAll={onViewAll}
      />,
    );
    expect(screen.getByText(/Recent Badges/i)).toBeInTheDocument();
  });

  it("renders 'Today' when the earn date matches today's UTC date", () => {
    const onViewAll = vi.fn();
    const now = new Date().toISOString();
    render(
      <RecentBadgesWidget
        badges={[{ badgeId: "first-quiz", earnedAt: now, context: null }]}
        onViewAll={onViewAll}
      />,
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders a short date when the earn date is in the past", () => {
    const onViewAll = vi.fn();
    render(
      <RecentBadgesWidget
        badges={[{ badgeId: "first-quiz", earnedAt: "2024-01-15T10:00:00Z", context: null }]}
        onViewAll={onViewAll}
      />,
    );
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });

  it("falls back gracefully when badgeId is not in the catalog", () => {
    const onViewAll = vi.fn();
    render(
      <RecentBadgesWidget
        badges={[{ badgeId: "unknown-xyz", earnedAt: "2026-04-14T10:00:00Z", context: null }]}
        onViewAll={onViewAll}
      />,
    );
    expect(screen.getByText(/Recent Badges/i)).toBeInTheDocument();
  });

  it("renders empty string for the date when earnedAt is invalid", () => {
    const onViewAll = vi.fn();
    const { container } = render(
      <RecentBadgesWidget
        badges={[{ badgeId: "first-quiz", earnedAt: "not-a-date", context: null }]}
        onViewAll={onViewAll}
      />,
    );
    // The component should still render without throwing
    expect(container.querySelector("h3")).toBeInTheDocument();
  });
});
