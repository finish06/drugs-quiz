import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import * as generators from "@/services/quiz-generators";
import type { MultipleChoiceQuestion } from "@/types/quiz";

vi.mock("@/services/quiz-generators");
const mockedGenerators = vi.mocked(generators);

const mockQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["ACE Inhibitor", "HMG-CoA Reductase Inhibitor", "PPI", "SSRI"],
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
});
