import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import * as generators from "@/services/quiz-generators";
import type { MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

vi.mock("@/services/quiz-generators");
const mockedGenerators = vi.mocked(generators);

const mockQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["ACE Inhibitor", "HMG-CoA Reductase Inhibitor", "PPI", "SSRI"],
};

const mockMatchQuestion: MatchingQuestion = {
  kind: "matching",
  leftItems: ["simvastatin", "lisinopril", "omeprazole", "metoprolol"],
  rightItems: ["Beta Blocker", "Statin", "ACE Inhibitor", "PPI"],
  correctPairs: {
    simvastatin: "Statin",
    lisinopril: "ACE Inhibitor",
    omeprazole: "PPI",
    metoprolol: "Beta Blocker",
  },
};

describe("App", () => {
  it("renders the app header", () => {
    render(<App />);
    expect(screen.getByText("drugs-quiz")).toBeInTheDocument();
  });

  it("shows quiz config screen by default", () => {
    render(<App />);
    expect(screen.getByText("Name the Class")).toBeInTheDocument();
    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("shows loading state after starting quiz", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockReturnValueOnce(
      new Promise(() => {}), // Never resolves — stays loading
    );

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(screen.getByText("Generating questions...")).toBeInTheDocument();
  });

  it("shows quiz question after loading", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(await screen.findByText("simvastatin")).toBeInTheDocument();
    expect(screen.getByText("HMG-CoA Reductase Inhibitor")).toBeInTheDocument();
  });

  it("shows error state when generation fails", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockRejectedValueOnce(
      new Error("API unavailable"),
    );

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });

  it("shows results after answering all questions", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    // Answer the question
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Excellent!")).toBeInTheDocument();
  });

  it("returns to config screen on New Quiz", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    await screen.findByText("New Quiz");
    await user.click(screen.getByText("New Quiz"));

    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("shows Exit button during quiz", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("simvastatin");
    expect(screen.getByText("Exit")).toBeInTheDocument();
  });

  it("renders matching quiz for match-drug-to-class type", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockMatchQuestion]);

    render(<App />);
    // Select Match Drug to Class
    await user.click(screen.getByText("Match Drug to Class"));
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("simvastatin");
    expect(screen.getByText("Drugs")).toBeInTheDocument();
    expect(screen.getByText("Classes")).toBeInTheDocument();
  });

  it("renders matching quiz with Generic/Brand labels for brand-generic type", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockMatchQuestion]);

    render(<App />);
    // Select Brand/Generic Match
    await user.click(screen.getByText("Brand/Generic Match"));
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("simvastatin");
    expect(screen.getByText("Generic")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
  });

  it("retries quiz with same config from results screen", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    // Complete the quiz
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    // Retry — mock returns new question
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockQuestion]);
    await screen.findByText("Retry");
    await user.click(screen.getByText("Retry"));

    // Should eventually show the question again
    expect(await screen.findByText("simvastatin")).toBeInTheDocument();
  });

  it("returns to config from error state via Back button", async () => {
    const user = userEvent.setup();
    mockedGenerators.generateQuestions.mockRejectedValueOnce(new Error("fail"));

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("Something went wrong");
    await user.click(screen.getByText("Back"));

    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });
});
