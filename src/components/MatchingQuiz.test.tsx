import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MatchingQuiz } from "./MatchingQuiz";
import type { MatchingQuestion } from "@/types/quiz";

const mockQuestion: MatchingQuestion = {
  kind: "matching",
  leftItems: ["simvastatin", "lisinopril", "omeprazole", "metoprolol"],
  rightItems: [
    "Beta Adrenergic Blocker",
    "HMG-CoA Reductase Inhibitor",
    "ACE Inhibitor",
    "Proton Pump Inhibitor",
  ],
  correctPairs: {
    simvastatin: "HMG-CoA Reductase Inhibitor",
    lisinopril: "ACE Inhibitor",
    omeprazole: "Proton Pump Inhibitor",
    metoprolol: "Beta Adrenergic Blocker",
  },
};

describe("MatchingQuiz", () => {
  it("displays all left and right items", () => {
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    expect(screen.getByText("simvastatin")).toBeInTheDocument();
    expect(screen.getByText("lisinopril")).toBeInTheDocument();
    expect(screen.getByText("HMG-CoA Reductase Inhibitor")).toBeInTheDocument();
    expect(screen.getByText("ACE Inhibitor")).toBeInTheDocument();
  });

  it("displays labels", () => {
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    expect(screen.getByText("Drugs")).toBeInTheDocument();
    expect(screen.getByText("Classes")).toBeInTheDocument();
  });

  it("shows progress indicator", () => {
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={2}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
  });

  it("does not show Check Answers before all pairs are matched", () => {
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    expect(screen.queryByText("Check Answers")).not.toBeInTheDocument();
  });

  it("allows creating a pair by clicking left then right", async () => {
    const user = userEvent.setup();
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    await user.click(screen.getByText("simvastatin"));
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));

    // The items should now be visually paired (both have colored backgrounds)
    // We can verify by checking that simvastatin button's class changed
    const simButton = screen.getByText("simvastatin").closest("button");
    expect(simButton?.className).toContain("border-blue-400");
  });

  it("shows Check Answers when all pairs are matched", async () => {
    const user = userEvent.setup();
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    // Match all 4 pairs
    await user.click(screen.getByText("simvastatin"));
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("lisinopril"));
    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("omeprazole"));
    await user.click(screen.getByText("Proton Pump Inhibitor"));
    await user.click(screen.getByText("metoprolol"));
    await user.click(screen.getByText("Beta Adrenergic Blocker"));

    expect(screen.getByText("Check Answers")).toBeInTheDocument();
  });

  it("calls onAnswer(true) when all pairs are correct", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    // Match all correctly
    await user.click(screen.getByText("simvastatin"));
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("lisinopril"));
    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("omeprazole"));
    await user.click(screen.getByText("Proton Pump Inhibitor"));
    await user.click(screen.getByText("metoprolol"));
    await user.click(screen.getByText("Beta Adrenergic Blocker"));

    await user.click(screen.getByText("Check Answers"));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it("calls onAnswer(false) when pairs are incorrect", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    // Match incorrectly — swap simvastatin and lisinopril's classes
    await user.click(screen.getByText("simvastatin"));
    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("lisinopril"));
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("omeprazole"));
    await user.click(screen.getByText("Proton Pump Inhibitor"));
    await user.click(screen.getByText("metoprolol"));
    await user.click(screen.getByText("Beta Adrenergic Blocker"));

    await user.click(screen.getByText("Check Answers"));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it("shows correct answers after submission", async () => {
    const user = userEvent.setup();
    render(
      <MatchingQuiz
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={5}
        leftLabel="Drugs"
        rightLabel="Classes"
      />,
    );

    // Match all
    await user.click(screen.getByText("simvastatin"));
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("lisinopril"));
    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("omeprazole"));
    await user.click(screen.getByText("Proton Pump Inhibitor"));
    await user.click(screen.getByText("metoprolol"));
    await user.click(screen.getByText("Beta Adrenergic Blocker"));

    await user.click(screen.getByText("Check Answers"));

    expect(screen.getByText("Correct answers:")).toBeInTheDocument();
  });
});
