import { useState, useCallback } from "react";
import type { QuizConfig, QuizSession, Question, Answer, QuizResults } from "@/types/quiz";
import { generateQuestions } from "@/services/quiz-generators";

interface UseQuizSessionReturn {
  session: QuizSession | null;
  results: QuizResults | null;
  error: string | null;
  startQuiz: (config: QuizConfig) => Promise<void>;
  submitAnswer: (correct: boolean) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
}

export function useQuizSession(): UseQuizSessionReturn {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(async (config: QuizConfig) => {
    setError(null);
    setSession({
      config,
      questions: [],
      answers: [],
      currentIndex: 0,
      status: "loading",
    });

    try {
      const questions: Question[] = await generateQuestions(config.type, config.questionCount);
      setSession({
        config,
        questions,
        answers: [],
        currentIndex: 0,
        status: "in-progress",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
      setSession(null);
    }
  }, []);

  const submitAnswer = useCallback((correct: boolean) => {
    setSession((prev) => {
      if (!prev || prev.status !== "in-progress") return prev;

      const answer: Answer = {
        questionIndex: prev.currentIndex,
        correct,
      };

      return {
        ...prev,
        answers: [...prev.answers, answer],
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.status !== "in-progress") return prev;

      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.questions.length) {
        return { ...prev, status: "complete" };
      }

      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  const results: QuizResults | null =
    session?.status === "complete"
      ? {
          totalQuestions: session.questions.length,
          correctAnswers: session.answers.filter((a) => a.correct).length,
          percentage: Math.round(
            (session.answers.filter((a) => a.correct).length / session.questions.length) * 100,
          ),
          answers: session.answers,
        }
      : null;

  return {
    session,
    results,
    error,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  };
}
