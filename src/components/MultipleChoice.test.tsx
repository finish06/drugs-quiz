import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MultipleChoice } from "./MultipleChoice";
import type { MultipleChoiceQuestion } from "@/types/quiz";

const mockQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: [
    "ACE Inhibitor",
    "HMG-CoA Reductase Inhibitor",
    "Proton Pump Inhibitor",
    "Beta Adrenergic Blocker",
  ],
};

describe("MultipleChoice", () => {
  it("displays the drug name", () => {
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    expect(screen.getByText("simvastatin")).toBeInTheDocument();
  });

  it("displays all 4 options", () => {
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    expect(screen.getByText("ACE Inhibitor")).toBeInTheDocument();
    expect(screen.getByText("HMG-CoA Reductase Inhibitor")).toBeInTheDocument();
    expect(screen.getByText("Proton Pump Inhibitor")).toBeInTheDocument();
    expect(screen.getByText("Beta Adrenergic Blocker")).toBeInTheDocument();
  });

  it("shows progress indicator", () => {
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={3}
        totalQuestions={10}
      />,
    );

    expect(screen.getByText("Question 3 of 10")).toBeInTheDocument();
  });

  it("calls onAnswer(true) when correct option is selected", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));

    expect(onAnswer).toHaveBeenCalledWith(true, "HMG-CoA Reductase Inhibitor");
  });

  it("calls onAnswer(false) when incorrect option is selected", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    await user.click(screen.getByText("ACE Inhibitor"));

    expect(onAnswer).toHaveBeenCalledWith(false, "ACE Inhibitor");
  });

  it("shows Next button after answering", async () => {
    const user = userEvent.setup();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    expect(screen.queryByText("Next Question")).not.toBeInTheDocument();

    await user.click(screen.getByText("ACE Inhibitor"));

    expect(screen.getByText("Next Question")).toBeInTheDocument();
  });

  it("shows See Results on the last question", async () => {
    const user = userEvent.setup();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        questionNumber={10}
        totalQuestions={10}
      />,
    );

    await user.click(screen.getByText("ACE Inhibitor"));

    expect(screen.getByText("See Results")).toBeInTheDocument();
  });

  it("calls onNext when Next button is clicked", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={vi.fn()}
        onNext={onNext}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("Next Question"));

    expect(onNext).toHaveBeenCalledOnce();
  });

  it("disables options after answering", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <MultipleChoice
        question={mockQuestion}
        onAnswer={onAnswer}
        onNext={vi.fn()}
        questionNumber={1}
        totalQuestions={10}
      />,
    );

    await user.click(screen.getByText("ACE Inhibitor"));
    await user.click(screen.getByText("Proton Pump Inhibitor"));

    // onAnswer should only be called once
    expect(onAnswer).toHaveBeenCalledOnce();
  });
});
