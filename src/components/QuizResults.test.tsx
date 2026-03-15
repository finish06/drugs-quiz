import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuizResults } from "./QuizResults";
import type { QuizResults as QuizResultsType } from "@/types/quiz";

function makeResults(correct: number, total: number): QuizResultsType {
  return {
    totalQuestions: total,
    correctAnswers: correct,
    percentage: Math.round((correct / total) * 100),
    answers: Array.from({ length: total }, (_, i) => ({
      questionIndex: i,
      correct: i < correct,
    })),
  };
}

describe("QuizResults", () => {
  it("displays the percentage score", () => {
    render(
      <QuizResults
        results={makeResults(7, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("displays correct and incorrect counts", () => {
    render(
      <QuizResults
        results={makeResults(7, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
  });

  it("displays encouraging message for high score", () => {
    render(
      <QuizResults
        results={makeResults(9, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Excellent!")).toBeInTheDocument();
  });

  it("displays practice message for low score", () => {
    render(
      <QuizResults
        results={makeResults(3, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Keep practicing!")).toBeInTheDocument();
  });

  it("shows question breakdown dots", () => {
    render(
      <QuizResults
        results={makeResults(7, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText("Question Breakdown")).toBeInTheDocument();
    // Check that breakdown dots have correct titles
    expect(screen.getByTitle("Question 1: Correct")).toBeInTheDocument();
    expect(screen.getByTitle("Question 8: Incorrect")).toBeInTheDocument();
  });

  it("calls onRetry when Retry is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <QuizResults
        results={makeResults(5, 10)}
        onNewQuiz={vi.fn()}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("calls onNewQuiz when New Quiz is clicked", async () => {
    const user = userEvent.setup();
    const onNewQuiz = vi.fn();
    render(
      <QuizResults
        results={makeResults(5, 10)}
        onNewQuiz={onNewQuiz}
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByText("New Quiz"));

    expect(onNewQuiz).toHaveBeenCalledOnce();
  });
});
