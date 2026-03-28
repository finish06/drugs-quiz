import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuizResults } from "./QuizResults";
import type { QuizResults as QuizResultsType } from "@/types/quiz";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

const baseResults: QuizResultsType = {
  totalQuestions: 10,
  correctAnswers: 8,
  percentage: 80,
  answers: Array.from({ length: 10 }, (_, i) => ({
    questionIndex: i,
    correct: i < 8,
    question: {
      kind: "multiple-choice" as const,
      drugName: `Drug ${i}`,
      correctAnswer: `Class ${i}`,
      options: [`Class ${i}`, "Other A", "Other B", "Other C"],
    },
    userAnswer: i < 8 ? `Class ${i}` : "Other A",
  })),
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("QuizResults — Share Link button (AC-001, AC-007, AC-021)", () => {
  it("AC-007: does NOT show Share Link for unauthenticated users", () => {
    render(
      <QuizResults
        results={baseResults}
        quizTypeLabel="Name the Class"
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /share link/i })).not.toBeInTheDocument();
  });

  it("AC-021: clipboard Share Results button is visible when clipboard API is available", () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <QuizResults
        results={baseResults}
        quizTypeLabel="Name the Class"
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/share quiz results/i)).toBeInTheDocument();
  });

  it("AC-001: shows Share Link button for authenticated users", async () => {
    const { useAuth } = await import("@/hooks/useAuth");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "user-1", email: "test@test.com", name: "Test", avatarUrl: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <QuizResults
        results={baseResults}
        quizTypeLabel="Name the Class"
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
        sessionId="session-123"
      />,
    );
    expect(screen.getByRole("button", { name: /share link/i })).toBeInTheDocument();
  });

  it("AC-006: shows Link Copied feedback after clicking Share Link", async () => {
    const { useAuth } = await import("@/hooks/useAuth");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "user-1", email: "test@test.com", name: "Test", avatarUrl: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ shareToken: "abc123", shareUrl: "/s/abc123" }),
    });

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(
      <QuizResults
        results={baseResults}
        quizTypeLabel="Name the Class"
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
        sessionId="session-123"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /share link/i }));

    await waitFor(() => {
      expect(screen.getByText(/link copied/i)).toBeInTheDocument();
    });
  });
});
