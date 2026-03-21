import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuizSession } from "./useQuizSession";
import * as generators from "@/services/quiz-generators";
import type { MultipleChoiceQuestion, MatchingQuestion, Question } from "@/types/quiz";

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

const mockClassPool = [{ name: "Class A", type: "epc" as const }];

/** Set up standard mocks for fetchEpcClassPool and generateSingleQuestion */
function setupStandardMocks(question: Question = mockMCQuestion) {
  mockedGenerators.fetchEpcClassPool.mockResolvedValue(mockClassPool);
  mockedGenerators.generateSingleQuestion.mockResolvedValue(question);
}

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
    let resolvePool: (value: typeof mockClassPool) => void;
    const pendingPool = new Promise<typeof mockClassPool>((resolve) => {
      resolvePool = resolve;
    });
    mockedGenerators.fetchEpcClassPool.mockReturnValueOnce(pendingPool);

    const { result } = renderHook(() => useQuizSession());

    act(() => {
      result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
    });

    expect(result.current.session?.status).toBe("loading");

    mockedGenerators.generateSingleQuestion.mockResolvedValue(mockMCQuestion);
    await act(async () => {
      resolvePool!(mockClassPool);
    });

    await waitFor(() => {
      expect(result.current.session?.status).toBe("in-progress");
    });
  });

  it("transitions to in-progress after questions load", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    expect(result.current.session?.status).toBe("in-progress");
    expect(result.current.session?.questions).toHaveLength(2);
    expect(result.current.session?.currentIndex).toBe(0);
  });

  it("sets error when question generation fails", async () => {
    mockedGenerators.fetchEpcClassPool.mockRejectedValueOnce(
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
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
    });

    expect(result.current.session?.answers).toHaveLength(1);
    expect(result.current.session?.answers[0]!.correct).toBe(true);
    expect(result.current.session?.answers[0]!.questionIndex).toBe(0);
  });

  it("AC-008: captures question and userAnswer in AnswerDetail", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
    });

    const answer = result.current.session?.answers[0];
    expect(answer).toHaveProperty("question");
    expect(answer).toHaveProperty("userAnswer");
    expect(answer!.question).toEqual(mockMCQuestion);
    expect(answer!.userAnswer).toBe("HMG-CoA Reductase Inhibitor");
  });

  it("AC-008: captures matching question pairs in AnswerDetail", async () => {
    setupStandardMocks(mockMatchQuestion);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "match-drug-to-class", questionCount: 2 });
    });

    const userPairs = { simvastatin: "HMG-CoA Reductase Inhibitor", lisinopril: "ACE Inhibitor" };
    act(() => {
      result.current.submitAnswer(true, userPairs);
    });

    const answer = result.current.session?.answers[0];
    expect(answer!.question.kind).toBe("matching");
    expect(answer!.userAnswer).toEqual(userPairs);
  });

  it("advances to next question", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
    });

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
      result.current.nextQuestion();
    });

    expect(result.current.session?.currentIndex).toBe(1);
  });

  it("transitions to complete after last question", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 1 });
    });

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
      result.current.nextQuestion();
    });

    expect(result.current.session?.status).toBe("complete");
  });

  it("computes results when quiz is complete", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 3 });
    });

    // Wait for background generation to complete (3 > 2 so background runs)
    await waitFor(() => {
      expect(result.current.session?.questions.length).toBe(3);
    });

    // Answer: correct, incorrect, correct
    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer(false, "ACE Inhibitor");
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
      result.current.nextQuestion();
    });

    expect(result.current.results).not.toBeNull();
    expect(result.current.results!.totalQuestions).toBe(3);
    expect(result.current.results!.correctAnswers).toBe(2);
    expect(result.current.results!.percentage).toBe(67);
  });

  it("resets quiz to initial state", async () => {
    setupStandardMocks();

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
    setupStandardMocks(mockMatchQuestion);

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "match-drug-to-class", questionCount: 1 });
    });

    expect(result.current.session?.questions[0]!.kind).toBe("matching");
  });

  it("handles non-Error thrown during generation", async () => {
    mockedGenerators.fetchEpcClassPool.mockRejectedValueOnce("string error");

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
    });

    expect(result.current.error).toBe("Failed to generate questions");
    expect(result.current.session).toBeNull();
  });

  it("ignores submitAnswer when no session exists", () => {
    const { result } = renderHook(() => useQuizSession());

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
    });

    expect(result.current.session).toBeNull();
  });

  it("ignores nextQuestion when no session exists", () => {
    const { result } = renderHook(() => useQuizSession());

    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.session).toBeNull();
  });

  it("ignores submitAnswer when quiz is complete", async () => {
    setupStandardMocks();

    const { result } = renderHook(() => useQuizSession());

    await act(async () => {
      await result.current.startQuiz({ type: "name-the-class", questionCount: 1 });
    });

    act(() => {
      result.current.submitAnswer(true, "HMG-CoA Reductase Inhibitor");
      result.current.nextQuestion();
    });

    expect(result.current.session?.status).toBe("complete");
    const answersBefore = result.current.session?.answers.length;

    act(() => {
      result.current.submitAnswer(false, "ACE Inhibitor");
    });

    expect(result.current.session?.answers.length).toBe(answersBefore);
  });

  describe("lazy loading", () => {
    it("starts quiz after 2 questions load, not all", async () => {
      let callCount = 0;
      const resolvers: Array<(q: Question) => void> = [];

      mockedGenerators.generateSingleQuestion.mockImplementation(() => {
        callCount++;
        const currentCall = callCount;
        if (currentCall <= 2) {
          return Promise.resolve({ ...mockMCQuestion, drugName: `drug-${currentCall}` });
        }
        // Background questions: return a promise we control
        return new Promise<Question>((resolve) => {
          resolvers.push(resolve);
        });
      });
      mockedGenerators.fetchEpcClassPool.mockResolvedValueOnce(mockClassPool);

      const { result } = renderHook(() => useQuizSession());

      await act(async () => {
        await result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
      });

      expect(result.current.session?.status).toBe("in-progress");
      expect(result.current.session?.questions.length).toBe(2);
    });

    it("background generation adds remaining questions", async () => {
      let callCount = 0;
      mockedGenerators.generateSingleQuestion.mockImplementation(async () => {
        callCount++;
        return { ...mockMCQuestion, drugName: `drug-${callCount}` };
      });
      mockedGenerators.fetchEpcClassPool.mockResolvedValueOnce(mockClassPool);

      const { result } = renderHook(() => useQuizSession());

      await act(async () => {
        await result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
      });

      await waitFor(() => {
        expect(result.current.session?.questions.length).toBe(5);
      });
    });

    it("shows generationComplete when all questions are done", async () => {
      let callCount = 0;
      mockedGenerators.generateSingleQuestion.mockImplementation(async () => {
        callCount++;
        return { ...mockMCQuestion, drugName: `drug-${callCount}` };
      });
      mockedGenerators.fetchEpcClassPool.mockResolvedValueOnce(mockClassPool);

      const { result } = renderHook(() => useQuizSession());

      await act(async () => {
        await result.current.startQuiz({ type: "name-the-class", questionCount: 5 });
      });

      await waitFor(() => {
        expect(result.current.session?.generationComplete).toBe(true);
      });
    });

    it("handles quiz with ≤2 questions without background loading", async () => {
      let callCount = 0;
      mockedGenerators.generateSingleQuestion.mockImplementation(async () => {
        callCount++;
        return { ...mockMCQuestion, drugName: `drug-${callCount}` };
      });
      mockedGenerators.fetchEpcClassPool.mockResolvedValueOnce(mockClassPool);

      const { result } = renderHook(() => useQuizSession());

      await act(async () => {
        await result.current.startQuiz({ type: "name-the-class", questionCount: 2 });
      });

      expect(result.current.session?.status).toBe("in-progress");
      expect(result.current.session?.questions.length).toBe(2);
      expect(result.current.session?.generationComplete).toBe(true);
    });
  });
});
