import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuizSession } from "./useQuizSession";
import * as generators from "@/services/quiz-generators";
import type { MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

vi.mock("@/services/quiz-generators");

const mockedGenerators = vi.mocked(generators);

const mockMCQuestion: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["HMG-CoA Reductase Inhibitor", "ACE Inhibitor", "PPI", "SSRI"],
};

const mockMatchQuestion: MatchingQuestion = {
  kind: "matching",
  leftItems: ["simvastatin", "lisinopril"],
  rightItems: ["HMG-CoA Reductase Inhibitor", "ACE Inhibitor"],
  correctPairs: {
    simvastatin: "HMG-CoA Reductase Inhibitor",
    lisinopril: "ACE Inhibitor",
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useQuizSession", () => {
  it("starts with null session and no error", () => {
    const { result } = renderHook(() => useQuizSession());

    expect(result.current.session).toBeNull();
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets loading state when starting a quiz", async () => {
    let resolveQuestions: (value: MultipleChoiceQuestion[]) => void;
    const pendingPromise = new Promise<MultipleChoiceQuestion[]>((resolve) => {
      resolveQuestions = resolve;
    });
    mockedGenerators.generateQuestions.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useQuizSession());

    act(() => {
      result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
    });

    expect(result.current.session?.status).toBe("loading");

    await act(async () => {
      resolveQuestions!([mockMCQuestion]);
    });

    expect(result.current.session?.status).toBe("in-progress");
  });

  it("transitions to in-progress after questions load", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([
      mockMCQuestion,
      mockMCQuestion,
    ]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    expect(result.current.session?.status).toBe("in-progress");
    expect(result.current.session?.questions).toHaveLength(2);
    expect(result.current.session?.currentIndex).toBe(0);
  });

  it("sets error when question generation fails", async () => {
    mockedGenerators.generateQuestions.mockRejectedValueOnce(
      new Error("API unavailable"),
    );

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
    });

    expect(result.current.error).toBe("API unavailable");
    expect(result.current.session).toBeNull();
  });

  it("records answers via submitAnswer", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([
      mockMCQuestion,
      mockMCQuestion,
    ]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    act(() => {
      result.current.submitAnswer(true);
    });

    expect(result.current.session?.answers).toHaveLength(1);
    expect(result.current.session?.answers[0]!.correct).toBe(true);
    expect(result.current.session?.answers[0]!.questionIndex).toBe(0);
  });

  it("advances to next question", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([
      mockMCQuestion,
      mockMCQuestion,
    ]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    act(() => {
      result.current.submitAnswer(true);
      result.current.nextQuestion();
    });

    expect(result.current.session?.currentIndex).toBe(1);
  });

  it("transitions to complete after last question", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockMCQuestion]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 1 });
    });

    act(() => {
      result.current.submitAnswer(true);
      result.current.nextQuestion();
    });

    expect(result.current.session?.status).toBe("complete");
  });

  it("computes results when quiz is complete", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([
      mockMCQuestion,
      mockMCQuestion,
      mockMCQuestion,
    ]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 3 });
    });

    // Answer: correct, incorrect, correct
    act(() => {
      result.current.submitAnswer(true);
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer(false);
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer(true);
      result.current.nextQuestion();
    });

    expect(result.current.results).not.toBeNull();
    expect(result.current.results!.totalQuestions).toBe(3);
    expect(result.current.results!.correctAnswers).toBe(2);
    expect(result.current.results!.percentage).toBe(67);
  });

  it("resets quiz to initial state", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockMCQuestion]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 1 });
    });

    act(() => {
      result.current.resetQuiz();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("works with matching questions", async () => {
    mockedGenerators.generateQuestions.mockResolvedValueOnce([mockMatchQuestion]);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "match-drug-to-class", questionCount: 1 });
    });

    expect(result.current.session?.questions[0]!.kind).toBe("matching");
  });
});
