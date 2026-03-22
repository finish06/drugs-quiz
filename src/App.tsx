import { useEffect, useMemo, useRef, useState } from "react";
import { QuizConfig } from "@/components/QuizConfig";
import { MultipleChoice } from "@/components/MultipleChoice";
import { MatchingQuiz } from "@/components/MatchingQuiz";
import { QuizResults } from "@/components/QuizResults";
import { FlashcardDrill } from "@/components/FlashcardDrill";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useQuizSession } from "@/hooks/useQuizSession";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { useDrugPerformance } from "@/hooks/useDrugPerformance";
import { useTheme } from "@/hooks/useTheme";
import type { QuizConfig as QuizConfigType } from "@/types/quiz";

function App() {
  const { session, results, error, loadingProgress, startQuiz, submitAnswer, nextQuestion, resetQuiz } =
    useQuizSession();
  const { theme, toggleTheme } = useTheme();
  const { sessions: sessionHistory, personalBest, isCollapsed: isHistoryCollapsed, saveSession, toggleCollapsed: toggleHistoryCollapsed } =
    useSessionHistory();
  const { recordResult, getWeakDrugs } = useDrugPerformance();
  const [showFlashcards, setShowFlashcards] = useState(false);

  const savedSessionRef = useRef(false);
  useEffect(() => {
    if (results && session?.config && !savedSessionRef.current) {
      savedSessionRef.current = true;
      saveSession({
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        quizType: session.config.type,
        questionCount: results.totalQuestions,
        correctCount: results.correctAnswers,
        percentage: results.percentage,
      });
    }
  }, [results, session?.config, saveSession]);

  // Record drug performance for spaced repetition
  const recordedSessionRef = useRef(false);
  useEffect(() => {
    if (results && session?.config && !recordedSessionRef.current) {
      recordedSessionRef.current = true;
      for (const answer of results.answers) {
          if (answer.question.kind === "multiple-choice") {
            recordResult(
              answer.question.drugName.toLowerCase(),
              answer.question.drugName,
              answer.question.correctAnswer,
              answer.correct,
            );
          } else if (answer.question.kind === "matching") {
            const pairs = answer.userAnswer as Record<string, string>;
            for (const [left, right] of Object.entries(answer.question.correctPairs)) {
              recordResult(
                left.toLowerCase(),
                left,
                right,
                pairs[left] === right,
              );
            }
          }
        }
    }
  }, [results, session?.config, recordResult]);

  function handleRetry() {
    if (session?.config) {
      savedSessionRef.current = false;
      recordedSessionRef.current = false;
      startQuiz(session.config);
    }
  }

  function handleStart(config: QuizConfigType) {
    savedSessionRef.current = false;
    recordedSessionRef.current = false;
    startQuiz(config);
  }

  function handleQuick5() {
    savedSessionRef.current = false;
    recordedSessionRef.current = false;
    startQuiz({ type: "quick-5", questionCount: 5 });
  }

  const weakDrugs = useMemo(() => getWeakDrugs(), [getWeakDrugs]);

  function renderContent() {
    // Error state (checked first — session may be null on error)
    if (error) {
      return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Something went wrong</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={resetQuiz}
            className="rounded-lg border-2 border-gray-300 dark:border-gray-600 px-6 py-2 font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:border-gray-400 dark:hover:border-gray-500"
          >
            Back
          </button>
        </div>
      );
    }

    // No session — show config screen
    if (!session) {
      return (
        <QuizConfig
          onStart={handleStart}
          onQuick5={handleQuick5}
          sessions={sessionHistory}
          personalBest={personalBest}
          isHistoryCollapsed={isHistoryCollapsed}
          onToggleHistoryCollapsed={toggleHistoryCollapsed}
          isLoading={false}
        />
      );
    }

    // Loading state with config visible but disabled
    if (session.status === "loading") {
      return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-12 shadow-sm text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-brand border-r-transparent" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {loadingProgress
              ? `Loading question ${loadingProgress.current} of ${loadingProgress.total}...`
              : "Generating questions..."}
          </p>
        </div>
      );
    }

    // Flashcard drill mode
    if (session.status === "complete" && showFlashcards && weakDrugs.length > 0) {
      return (
        <FlashcardDrill
          weakDrugs={weakDrugs}
          onExit={() => setShowFlashcards(false)}
        />
      );
    }

    // Results state
    if (session.status === "complete" && results) {
      return (
        <QuizResults
          results={results}
          onNewQuiz={resetQuiz}
          onRetry={handleRetry}
          weakDrugCount={weakDrugs.length}
          onStudyWeakDrugs={weakDrugs.length > 0 ? () => setShowFlashcards(true) : undefined}
        />
      );
    }

    // In-progress — waiting for background generation to catch up
    if (
      session.status === "in-progress" &&
      session.currentIndex >= session.questions.length &&
      !session.generationComplete
    ) {
      return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-12 shadow-sm text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-brand border-r-transparent" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading next question...</p>
        </div>
      );
    }

    // In-progress — render the current question
    const currentQuestion = session.questions[session.currentIndex];
    if (!currentQuestion) return null;

    if (currentQuestion.kind === "multiple-choice") {
      return (
        <MultipleChoice
          key={session.currentIndex}
          question={currentQuestion}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          questionNumber={session.currentIndex + 1}
          totalQuestions={session.config.questionCount}
        />
      );
    }

    if (currentQuestion.kind === "matching") {
      const isClassMatch = currentQuestion.sourceType === "match-drug-to-class" ||
        (currentQuestion.sourceType === undefined && session.config.type === "match-drug-to-class");
      return (
        <MatchingQuiz
          key={session.currentIndex}
          question={currentQuestion}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          questionNumber={session.currentIndex + 1}
          totalQuestions={session.config.questionCount}
          leftLabel={isClassMatch ? "Drugs" : "Generic"}
          rightLabel={isClassMatch ? "Classes" : "Brand"}
        />
      );
    }

    return null;
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-150">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-150">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
                alt="drugs-quiz logo"
                className="h-8 w-8 rounded"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">drugs-quiz</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500">Pharmacy exam prep</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </button>
              {session && (
                <button
                  onClick={() => {
                    if (session.status === "in-progress") {
                      if (window.confirm("Are you sure? Your progress will be lost.")) {
                        resetQuiz();
                      }
                    } else {
                      resetQuiz();
                    }
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{renderContent()}</main>
    </div>
    </ErrorBoundary>
  );
}

export default App;
