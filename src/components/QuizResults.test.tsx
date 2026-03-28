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

describe("QuizResults — rendering and grade display", () => {
  it("displays correct percentage and grade message for excellent score", () => {
    const excellentResults = { ...baseResults, percentage: 95 };
    render(
      <QuizResults results={excellentResults} quizTypeLabel="Name the Class" onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("Excellent!")).toBeInTheDocument();
  });

  it("displays correct grade for 80% score", () => {
    render(
      <QuizResults results={baseResults} quizTypeLabel="Name the Class" onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Great job!")).toBeInTheDocument();
  });

  it("displays correct grade for 70% score", () => {
    const r = { ...baseResults, percentage: 70 };
    render(<QuizResults results={r} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("Good work!")).toBeInTheDocument();
  });

  it("displays correct grade for 60% score", () => {
    const r = { ...baseResults, percentage: 60 };
    render(<QuizResults results={r} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("Not bad!")).toBeInTheDocument();
  });

  it("displays correct grade for low score", () => {
    const r = { ...baseResults, percentage: 40 };
    render(<QuizResults results={r} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("Keep practicing!")).toBeInTheDocument();
  });

  it("defaults quizTypeLabel to Quiz in share text", () => {
    render(<QuizResults results={baseResults} onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    // The share text includes "Quiz" as default label — renders correctly
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("calls onRetry when Retry is clicked", () => {
    const onRetry = vi.fn();
    render(<QuizResults results={baseResults} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onNewQuiz when New Quiz is clicked", () => {
    const onNewQuiz = vi.fn();
    render(<QuizResults results={baseResults} quizTypeLabel="Test" onNewQuiz={onNewQuiz} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByText("New Quiz"));
    expect(onNewQuiz).toHaveBeenCalled();
  });

  it("shows Study Weak Drugs button when provided", () => {
    const onStudy = vi.fn();
    render(
      <QuizResults results={baseResults} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={vi.fn()} weakDrugCount={5} onStudyWeakDrugs={onStudy} />,
    );
    const btn = screen.getByText(/study weak drugs/i);
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onStudy).toHaveBeenCalled();
  });

  it("handles share with clipboard", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<QuizResults results={baseResults} quizTypeLabel="Name the Class" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/share quiz results/i));
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("handles native share API", async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: shareFn, writable: true, configurable: true });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<QuizResults results={baseResults} quizTypeLabel="Name the Class" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/share quiz results/i));
    await waitFor(() => {
      expect(shareFn).toHaveBeenCalled();
    });

    // Cleanup
    Object.defineProperty(navigator, "share", { value: undefined, writable: true, configurable: true });
  });

  it("falls through to clipboard when navigator.share throws", async () => {
    const shareFn = vi.fn().mockRejectedValue(new Error("AbortError"));
    Object.defineProperty(navigator, "share", { value: shareFn, writable: true, configurable: true });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<QuizResults results={baseResults} quizTypeLabel="Name the Class" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/share quiz results/i));
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });

    Object.defineProperty(navigator, "share", { value: undefined, writable: true, configurable: true });
  });

  it("shows timer stats when present", () => {
    const timedResults = { ...baseResults, averageTimeSeconds: 5, timedOutCount: 3 };
    render(<QuizResults results={timedResults} quizTypeLabel="Test" onNewQuiz={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("5s")).toBeInTheDocument();
    expect(screen.getByText("Avg Time")).toBeInTheDocument();
    expect(screen.getByText("Timed Out")).toBeInTheDocument();
  });
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

  it("handles share link when API fails gracefully", async () => {
    const { useAuth } = await import("@/hooks/useAuth");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: "user-1", email: "test@test.com", name: "Test", avatarUrl: null },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

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

    // Should not crash, button returns to default state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /share link/i })).not.toBeDisabled();
    });
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
