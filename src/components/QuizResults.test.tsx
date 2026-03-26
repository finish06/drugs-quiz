import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuizResults } from "./QuizResults";
import type { QuizResults as QuizResultsType, MultipleChoiceQuestion } from "@/types/quiz";

const mockMCQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "Simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["ACE Inhibitor", "HMG-CoA Reductase Inhibitor", "PPI", "SSRI"],
};

function makeResults(correct: number, total: number): QuizResultsType {
  return {
    totalQuestions: total,
    correctAnswers: correct,
    percentage: Math.round((correct / total) * 100),
    answers: Array.from({ length: total }, (_, i) => ({
      questionIndex: i,
      correct: i < correct,
      question: mockMCQuestion,
      userAnswer: i < correct ? "HMG-CoA Reductase Inhibitor" : "ACE Inhibitor",
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

  it("AC-006: shows Study Weak Drugs button when weak drugs exist", () => {
    const onStudy = vi.fn();
    render(
      <QuizResults
        results={makeResults(5, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
        weakDrugCount={5}
        onStudyWeakDrugs={onStudy}
      />,
    );

    expect(screen.getByText(/Study Weak Drugs/)).toBeInTheDocument();
    expect(screen.getByText(/5 to review/)).toBeInTheDocument();
  });

  it("does not show Study button when no weak drugs", () => {
    render(
      <QuizResults
        results={makeResults(10, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Study Weak Drugs/)).not.toBeInTheDocument();
  });

  it("calls onStudyWeakDrugs when Study button is clicked", async () => {
    const user = userEvent.setup();
    const onStudy = vi.fn();
    render(
      <QuizResults
        results={makeResults(5, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
        weakDrugCount={3}
        onStudyWeakDrugs={onStudy}
      />,
    );

    await user.click(screen.getByText(/Study Weak Drugs/));
    expect(onStudy).toHaveBeenCalledOnce();
  });

  it("shows Share Results button", () => {
    render(
      <QuizResults
        results={makeResults(8, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Share quiz results")).toBeInTheDocument();
    expect(screen.getByText("Share Results")).toBeInTheDocument();
  });

  it("copies share text to clipboard on click", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(
      <QuizResults
        results={makeResults(8, 10)}
        quizTypeLabel="Name the Class"
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("Share quiz results"));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("80%"),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Name the Class"),
    );
  });

  it("shows Copied! feedback after sharing", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(
      <QuizResults
        results={makeResults(8, 10)}
        onNewQuiz={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("Share quiz results"));
    expect(await screen.findByText("Copied!")).toBeInTheDocument();
  });

  it("shows average time when results include timing data", () => {
    const timedResults = {
      ...makeResults(8, 10),
      averageTimeSeconds: 12,
    };
    render(
      <QuizResults results={timedResults} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(screen.getByText("12s")).toBeInTheDocument();
    expect(screen.getByText("Avg Time")).toBeInTheDocument();
  });

  it("shows timed out count when results include timeouts", () => {
    const timedResults = {
      ...makeResults(6, 10),
      timedOutCount: 2,
    };
    render(
      <QuizResults results={timedResults} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(screen.getByText("Timed Out")).toBeInTheDocument();
    // The count "2" appears multiple times (breakdown dots), so check it exists near "Timed Out"
    const timedOutLabel = screen.getByText("Timed Out");
    const timedOutSection = timedOutLabel.closest("div")!;
    expect(timedOutSection.textContent).toContain("2");
  });

  it("marks timed-out questions with clock icon in breakdown", () => {
    const results = makeResults(4, 5);
    results.answers[4]!.timedOut = true;
    render(
      <QuizResults results={results} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );

    expect(screen.getByTitle("Question 5: Timed out")).toBeInTheDocument();
  });

  it("shows different grade messages", () => {
    const { rerender } = render(
      <QuizResults results={makeResults(8, 10)} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Great job!")).toBeInTheDocument();

    rerender(
      <QuizResults results={makeResults(7, 10)} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Good work!")).toBeInTheDocument();

    rerender(
      <QuizResults results={makeResults(6, 10)} onNewQuiz={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Not bad!")).toBeInTheDocument();
  });
});
