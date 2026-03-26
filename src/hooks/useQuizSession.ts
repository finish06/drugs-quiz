import { useState, useCallback, useRef, useEffect } from "react";
import type { QuizConfig, QuizSession, Question, AnswerDetail, QuizResults } from "@/types/quiz";
import { generateSingleQuestion, fetchEpcClassPool } from "@/services/quiz-generators";
import type { DrugClass } from "@/types/api";

interface UseQuizSessionReturn {
  session: QuizSession | null;
  results: QuizResults | null;
  error: string | null;
  loadingProgress: { current: number; total: number } | null;
  startQuiz: (config: QuizConfig) => Promise<void>;
  submitAnswer: (correct: boolean, userAnswer: string | Record<string, string>) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
}

export function useQuizSession(): UseQuizSessionReturn {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  const cancelledRef = useRef(false);
  const classPoolRef = useRef<DrugClass[]>([]);
  const usedDrugsRef = useRef<Set<string>>(new Set());
  const generationIdRef = useRef(0);

  // Cancel background generation on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const backgroundGenerate = useCallback(async (config: QuizConfig, startIndex: number, genId: number) => {
    for (let i = startIndex; i < config.questionCount; i++) {
      if (cancelledRef.current || generationIdRef.current !== genId) return;

      try {
        const question = await generateSingleQuestion(
          config.type,
          classPoolRef.current,
          usedDrugsRef.current,
        );

        if (cancelledRef.current || generationIdRef.current !== genId) return;

        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            questions: [...prev.questions, question],
          };
        });
      } catch {
        // If a background question fails, skip it
        continue;
      }
    }

    if (!cancelledRef.current && generationIdRef.current === genId) {
      setSession((prev) => {
        if (!prev) return prev;
        // If fewer questions were generated than requested (due to failures),
        // adjust the config count to match actual questions to prevent blank screen
        const actualCount = prev.questions.length;
        const adjustedConfig = actualCount < prev.config.questionCount
          ? { ...prev.config, questionCount: actualCount }
          : prev.config;
        return { ...prev, config: adjustedConfig, generationComplete: true };
      });
    }
  }, []);

  const startQuiz = useCallback(async (config: QuizConfig) => {
    setError(null);
    setLoadingProgress(null);
    cancelledRef.current = false;
    const currentGenId = ++generationIdRef.current;

    setSession({
      config,
      questions: [],
      answers: [],
      currentIndex: 0,
      status: "loading",
      generationComplete: false,
    });

    try {
      const classPool = await fetchEpcClassPool();
      classPoolRef.current = classPool;
      usedDrugsRef.current = new Set<string>();

      const initialCount = Math.min(2, config.questionCount);
      const initialQuestions: Question[] = [];

      for (let i = 0; i < initialCount; i++) {
        if (cancelledRef.current || generationIdRef.current !== currentGenId) return;
        const question = await generateSingleQuestion(config.type, classPool, usedDrugsRef.current);
        initialQuestions.push(question);
        setLoadingProgress({ current: i + 1, total: config.questionCount });
      }

      if (cancelledRef.current || generationIdRef.current !== currentGenId) return;

      setLoadingProgress(null);
      const isComplete = config.questionCount <= 2;
      setSession({
        config,
        questions: initialQuestions,
        answers: [],
        currentIndex: 0,
        status: "in-progress",
        generationComplete: isComplete,
      });

      if (!isComplete) {
        backgroundGenerate(config, 2, currentGenId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
      setSession(null);
    }
  }, [backgroundGenerate]);

  const submitAnswer = useCallback((correct: boolean, userAnswer: string | Record<string, string>) => {
    setSession((prev) => {
      if (!prev || prev.status !== "in-progress") return prev;

      const currentQuestion = prev.questions[prev.currentIndex];
      const answer: AnswerDetail = {
        questionIndex: prev.currentIndex,
        correct,
        question: currentQuestion!,
        userAnswer,
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
      // Use actual questions length (not config.questionCount) to avoid
      // blank screen when background generation produced fewer questions
      const effectiveCount = prev.generationComplete
        ? prev.questions.length
        : prev.config.questionCount;
      if (nextIndex >= effectiveCount) {
        return { ...prev, status: "complete" };
      }

      return { ...prev, currentIndex: nextIndex };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    cancelledRef.current = true;
    usedDrugsRef.current = new Set();
    setSession(null);
    setError(null);
  }, []);

  const results: QuizResults | null =
    session?.status === "complete"
      ? {
          totalQuestions: session.answers.length,
          correctAnswers: session.answers.filter((a) => a.correct).length,
          percentage: session.answers.length > 0
            ? Math.round(
                (session.answers.filter((a) => a.correct).length / session.answers.length) * 100,
              )
            : 0,
          answers: session.answers,
        }
      : null;

  return {
    session,
    results,
    error,
    loadingProgress,
    startQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  };
}
