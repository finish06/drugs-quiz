import { QuizConfig } from "@/components/QuizConfig";
import { MultipleChoice } from "@/components/MultipleChoice";
import { MatchingQuiz } from "@/components/MatchingQuiz";
import { QuizResults } from "@/components/QuizResults";
import { useQuizSession } from "@/hooks/useQuizSession";
import { useTheme } from "@/hooks/useTheme";
import type { QuizConfig as QuizConfigType } from "@/types/quiz";

function App() {
  const { session, results, error, loadingProgress, startQuiz, submitAnswer, nextQuestion, resetQuiz } =
    useQuizSession();
  const { theme, toggleTheme } = useTheme();

  function handleRetry() {
    if (session?.config) {
      startQuiz(session.config);
    }
  }

  function handleStart(config: QuizConfigType) {
    startQuiz(config);
  }

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
      return <QuizConfig onStart={handleStart} />;
    }

    // Loading state
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

    // Results state
    if (session.status === "complete" && results) {
      return (
        <QuizResults
          results={results}
          onNewQuiz={resetQuiz}
          onRetry={handleRetry}
        />
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
          totalQuestions={session.questions.length}
        />
      );
    }

    if (currentQuestion.kind === "matching") {
      const isClassMatch = session.config.type === "match-drug-to-class";
      return (
        <MatchingQuiz
          key={session.currentIndex}
          question={currentQuestion}
          onAnswer={submitAnswer}
          onNext={nextQuestion}
          questionNumber={session.currentIndex + 1}
          totalQuestions={session.questions.length}
          leftLabel={isClassMatch ? "Drugs" : "Generic"}
          rightLabel={isClassMatch ? "Classes" : "Brand"}
        />
      );
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-150">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-150">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
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
                  onClick={resetQuiz}
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
  );
}

export default App;
