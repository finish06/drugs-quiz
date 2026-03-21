import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { AnswerReviewSection } from "./AnswerReviewSection";
import type { AnswerDetail, MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

const mcCorrectQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "Simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["ACE Inhibitor", "HMG-CoA Reductase Inhibitor", "Beta Blocker", "PPI"],
};

const mcWrongQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "Amlodipine",
  correctAnswer: "Calcium Channel Blocker",
  options: ["ACE Inhibitor", "Calcium Channel Blocker", "Beta Blocker", "PPI"],
};

const matchingQuestion: MatchingQuestion = {
  kind: "matching",
  leftItems: ["Lisinopril", "Metformin"],
  rightItems: ["ACE Inhibitor", "Biguanide"],
  correctPairs: { Lisinopril: "ACE Inhibitor", Metformin: "Biguanide" },
  sourceType: "match-drug-to-class",
};

const mockAnswers: AnswerDetail[] = [
  {
    questionIndex: 0,
    correct: true,
    question: mcCorrectQuestion,
    userAnswer: "HMG-CoA Reductase Inhibitor",
  },
  {
    questionIndex: 1,
    correct: false,
    question: mcWrongQuestion,
    userAnswer: "ACE Inhibitor",
  },
  {
    questionIndex: 2,
    correct: true,
    question: matchingQuestion,
    userAnswer: { Lisinopril: "ACE Inhibitor", Metformin: "Biguanide" },
  },
];

describe("AC-005: Review Answers section on results screen", () => {
  it("should render Review Answers heading", () => {
    render(<AnswerReviewSection answers={mockAnswers} />);
    expect(screen.getByText("Review Answers")).toBeInTheDocument();
  });
});

describe("AC-006: Review entry shows question details", () => {
  it("should show drug name for MC questions", () => {
    render(<AnswerReviewSection answers={mockAnswers} />);
    expect(screen.getByText(/Simvastatin/)).toBeInTheDocument();
    expect(screen.getByText(/Amlodipine/)).toBeInTheDocument();
  });

  it("should show correct answer for wrong MC questions", () => {
    render(<AnswerReviewSection answers={mockAnswers} />);
    expect(screen.getByText(/Calcium Channel Blocker/)).toBeInTheDocument();
  });

  it("should show matching question results", () => {
    render(<AnswerReviewSection answers={mockAnswers} />);
    expect(screen.getByText(/Match/)).toBeInTheDocument();
    expect(screen.getByText(/2\/2/)).toBeInTheDocument();
  });
});

describe("AC-007: Review section is collapsible", () => {
  it("should be expanded by default", () => {
    render(<AnswerReviewSection answers={mockAnswers} />);
    // Content should be visible
    expect(screen.getByText(/Simvastatin/)).toBeVisible();
  });

  it("should collapse when header is clicked", async () => {
    const user = userEvent.setup();
    render(<AnswerReviewSection answers={mockAnswers} />);

    await user.click(screen.getByText("Review Answers"));

    // Content should be hidden (display: none)
    expect(screen.getByText(/Simvastatin/).closest("div[style]")).toHaveStyle("display: none");
  });
});
