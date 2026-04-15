import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgesPage } from "./BadgesPage";

/**
 * Tests for BadgesPage component.
 * Spec: specs/achievements-badges.md AC-013, AC-010
 */

// Mock useAchievements hook
vi.mock("@/hooks/useAchievements", () => ({
  useAchievements: vi.fn(),
  ACHIEVEMENTS_STORAGE_KEY: "rxdrill:achievements:v1",
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";

function renderWithRouter(ui: React.ReactElement) {
  return render(ui);
}

beforeEach(() => {
  vi.resetAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    isAuthenticated: true,
    user: { name: "Test User" },
    isLoading: false,
    login: vi.fn(),
  });
});

// ──────────────────────────────────────────────
// AC-013: BadgesPage states
// ──────────────────────────────────────────────
describe("AC-013: BadgesPage loading state", () => {
  it("should show loading skeleton when isLoading is true", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: true,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    // Loading state should show skeleton or loading indicator
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

describe("AC-013: BadgesPage empty state", () => {
  it("should show encouragement message when no badges earned", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    expect(screen.getByText(/Complete a quiz to earn your first badge/i)).toBeInTheDocument();
  });

  it("should show all 5 badges as locked when no badges earned", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    // All 5 badge names should appear
    expect(screen.getByText(/First Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/Perfect Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Class Master/i)).toBeInTheDocument();
    expect(screen.getByText(/Centurion/i)).toBeInTheDocument();
    expect(screen.getByText(/Streak Seeker/i)).toBeInTheDocument();
  });
});

describe("AC-013: BadgesPage populated state (earned-first ordering)", () => {
  it("should show earned badges section when user has badges", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [
        { badgeId: "first-quiz", earnedAt: "2026-04-13T10:00:00Z", context: null },
        { badgeId: "perfect-score", earnedAt: "2026-04-14T10:00:00Z", context: null },
      ],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    // Should show "Your Achievements" or "Earned" heading
    expect(screen.getByText(/earned/i)).toBeInTheDocument();
    expect(screen.getByText(/2 of 5/i)).toBeInTheDocument();
  });

  it("should show locked section for unearned badges", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [
        { badgeId: "first-quiz", earnedAt: "2026-04-13T10:00:00Z", context: null },
      ],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    // Locked section should have criteria text for unearned badges
    expect(screen.getByText(/Locked/i)).toBeInTheDocument();
  });
});

describe("AC-017: BadgesPage emits badges_viewed analytics on mount", () => {
  it("should call window.umami.track with badges_viewed on mount", () => {
    const trackFn = vi.fn();
    Object.defineProperty(window, "umami", { value: { track: trackFn }, writable: true, configurable: true });

    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    expect(trackFn).toHaveBeenCalledWith("badges_viewed");

    Object.defineProperty(window, "umami", { value: undefined, writable: true, configurable: true });
  });
});

describe("AC-010: BadgesPage guest sign-in banner", () => {
  it("should show sign-in banner for unauthenticated users", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: vi.fn(),
    });
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    expect(screen.getByText(/Sign in to keep your badges across devices/i)).toBeInTheDocument();
  });

  it("should NOT show sign-in banner for authenticated users", () => {
    (useAchievements as ReturnType<typeof vi.fn>).mockReturnValue({
      earnedBadges: [],
      isLoading: false,
      checkAfterSession: vi.fn(),
      saveGuestBadge: vi.fn(),
      migrateGuestBadges: vi.fn(),
      refresh: vi.fn(),
    });

    renderWithRouter(<BadgesPage />);
    expect(screen.queryByText(/Sign in to keep your badges/i)).not.toBeInTheDocument();
  });
});
