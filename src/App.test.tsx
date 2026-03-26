import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import * as generators from "@/services/quiz-generators";
import type { MultipleChoiceQuestion, MatchingQuestion, Question } from "@/types/quiz";

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

const mockClassPool = [{ name: "Class A", type: "epc" as const }];

/** Set up standard mocks for lazy-loading quiz generation */
function setupMocks(question: Question = mockQuestion) {
  mockedGenerators.fetchEpcClassPool.mockResolvedValue(mockClassPool);
  mockedGenerators.generateSingleQuestion.mockResolvedValue(question);
}

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
    // Make fetchEpcClassPool hang to keep loading state
    mockedGenerators.fetchEpcClassPool.mockImplementationOnce(
      () => new Promise(() => {}), // Never resolves — stays loading
    );

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(screen.getByText("Generating questions...")).toBeInTheDocument();
  });

  it("shows quiz question after loading", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(await screen.findByText("simvastatin")).toBeInTheDocument();
    expect(screen.getByText("HMG-CoA Reductase Inhibitor")).toBeInTheDocument();
  });

  it("shows error state when generation fails", async () => {
    const user = userEvent.setup();
    mockedGenerators.fetchEpcClassPool.mockRejectedValueOnce(
      new Error("API unavailable"),
    );

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });

  it("shows results after answering all questions", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    // Select 5 questions (the minimum)
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("Start Quiz"));

    // Answer all 5 questions
    for (let i = 0; i < 4; i++) {
      await screen.findByText("simvastatin");
      await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
      await user.click(screen.getByText("Next Question"));
    }
    // Last question: "See Results"
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Excellent!")).toBeInTheDocument();
  });

  it("returns to config screen on New Quiz", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("Start Quiz"));

    // Answer all 5 questions
    for (let i = 0; i < 4; i++) {
      await screen.findByText("simvastatin");
      await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
      await user.click(screen.getByText("Next Question"));
    }
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    await screen.findByText("New Quiz");
    await user.click(screen.getByText("New Quiz"));

    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("shows Exit button during quiz", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("simvastatin");
    expect(screen.getByText("Exit")).toBeInTheDocument();
  });

  it("renders matching quiz for match-drug-to-class type", async () => {
    const user = userEvent.setup();
    setupMocks(mockMatchQuestion);

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
    setupMocks(mockMatchQuestion);

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
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("Start Quiz"));

    // Complete all 5 questions
    for (let i = 0; i < 4; i++) {
      await screen.findByText("simvastatin");
      await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
      await user.click(screen.getByText("Next Question"));
    }
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    // Retry
    await screen.findByText("Retry");
    await user.click(screen.getByText("Retry"));

    // Should eventually show the question again
    expect(await screen.findByText("simvastatin")).toBeInTheDocument();
  });

  it("returns to config from error state via Back button", async () => {
    const user = userEvent.setup();
    mockedGenerators.fetchEpcClassPool.mockRejectedValueOnce(new Error("fail"));

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));

    await screen.findByText("Something went wrong");
    await user.click(screen.getByText("Back"));

    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("shows inline exit confirmation during in-progress quiz", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));
    await screen.findByText("simvastatin");

    // Click Exit during quiz — should show inline confirm
    await user.click(screen.getByText("Exit"));
    expect(screen.getByText("Quit?")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("cancels exit when clicking No", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));
    await screen.findByText("simvastatin");

    await user.click(screen.getByText("Exit"));
    await user.click(screen.getByText("No"));

    // Should still be in quiz
    expect(screen.getByText("simvastatin")).toBeInTheDocument();
    expect(screen.getByText("Exit")).toBeInTheDocument();
  });

  it("exits quiz when clicking Yes on exit confirmation", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("Start Quiz"));
    await screen.findByText("simvastatin");

    await user.click(screen.getByText("Exit"));
    await user.click(screen.getByText("Yes"));

    // Should return to config screen
    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("exits directly from results screen without confirmation", async () => {
    const user = userEvent.setup();
    setupMocks();

    render(<App />);
    await user.click(screen.getByText("5"));
    await user.click(screen.getByText("Start Quiz"));

    for (let i = 0; i < 4; i++) {
      await screen.findByText("simvastatin");
      await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
      await user.click(screen.getByText("Next Question"));
    }
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("See Results"));

    await screen.findByText("100%");
    // Exit from results — no confirmation needed
    await user.click(screen.getByText("Exit"));
    expect(screen.getByText("Start Quiz")).toBeInTheDocument();
  });

  it("shows inline loading when user is ahead of background generation", async () => {
    let callCount = 0;
    mockedGenerators.generateSingleQuestion.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.resolve(mockQuestion);
      }
      // Background questions never resolve
      return new Promise(() => {});
    });
    mockedGenerators.fetchEpcClassPool.mockResolvedValue(mockClassPool);

    const user = userEvent.setup();
    render(<App />);

    // Default config is "name-the-class" with 5 questions
    await user.click(screen.getByText("Start Quiz"));

    // Wait for quiz to start
    await screen.findByText("simvastatin");

    // Answer Q1 correctly
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("Next Question"));

    // Answer Q2 correctly
    await screen.findByText("simvastatin");
    await user.click(screen.getByText("HMG-CoA Reductase Inhibitor"));
    await user.click(screen.getByText("Next Question"));

    // Now user is at index 2 but only 2 questions loaded — should show inline loading
    expect(await screen.findByText("Loading next question...")).toBeInTheDocument();
  });
});
