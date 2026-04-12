import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressDashboard } from "./ProgressDashboard";
import type { StatsData } from "@/types/stats";

const mockStats: StatsData = {
  overallAccuracy: 74.5,
  totalQuizzes: 42,
  totalQuestions: 380,
  currentStreak: 5,
  longestStreak: 12,
  quizTypeBreakdown: [
    { quizType: "name-the-class", accuracy: 78.2, count: 18 },
    { quizType: "match-drug-to-class", accuracy: 71.0, count: 12 },
    { quizType: "brand-generic-match", accuracy: 69.5, count: 8 },
    { quizType: "quick-5", accuracy: 80.0, count: 4 },
  ],
  weakestClasses: [
    { className: "Aminoglycoside Antibacterial", accuracy: 33.3, totalSeen: 6 },
    { className: "Loop Diuretic", accuracy: 40.0, totalSeen: 5 },
  ],
  strongestClasses: [
    { className: "HMG-CoA Reductase Inhibitor", accuracy: 100.0, totalSeen: 8 },
    { className: "ACE Inhibitor", accuracy: 95.0, totalSeen: 10 },
  ],
  trendData: [
    { date: "2026-04-11", accuracy: 80.0, count: 15 },
    { date: "2026-04-10", accuracy: 70.0, count: 10 },
  ],
};

describe("ProgressDashboard — AC-002 through AC-013, AC-017, AC-020", () => {
  it("AC-004: displays overall accuracy", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText("74.5%")).toBeInTheDocument();
  });

  it("AC-009: displays total quizzes", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("AC-010: displays total questions", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText("380")).toBeInTheDocument();
  });

  it("AC-011: displays current streak", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });

  it("AC-007: displays weakest classes", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText(/Aminoglycoside/)).toBeInTheDocument();
    expect(screen.getByText(/Loop Diuretic/)).toBeInTheDocument();
  });

  it("AC-008: displays strongest classes", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText(/HMG-CoA/)).toBeInTheDocument();
    expect(screen.getByText(/ACE Inhibitor/)).toBeInTheDocument();
  });

  it("AC-013: displays quiz type breakdown", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText(/Name the Class/)).toBeInTheDocument();
    expect(screen.getByText(/78%/)).toBeInTheDocument();
  });

  it("AC-006: renders time range tabs", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} />);
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("30d")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("AC-006: fires onRangeChange when tab is clicked", () => {
    const onRange = vi.fn();
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} onRangeChange={onRange} />);
    fireEvent.click(screen.getByText("7d"));
    expect(onRange).toHaveBeenCalledWith(7);
  });

  it("AC-003: calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<ProgressDashboard stats={mockStats} onBack={onBack} />);
    fireEvent.click(screen.getByText(/← Back/));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("AC-020: shows empty state when no data", () => {
    const emptyStats: StatsData = {
      ...mockStats,
      totalQuizzes: 0,
      totalQuestions: 0,
      overallAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      quizTypeBreakdown: [],
      weakestClasses: [],
      strongestClasses: [],
      trendData: [],
    };
    render(<ProgressDashboard stats={emptyStats} onBack={vi.fn()} />);
    expect(screen.getByText(/complete your first quiz/i)).toBeInTheDocument();
  });

  it("AC-016: shows sign-in CTA when unauthenticated", () => {
    render(<ProgressDashboard stats={mockStats} onBack={vi.fn()} showSignInCta />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
