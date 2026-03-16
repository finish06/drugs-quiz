import { useCallback } from "react";
import { QuizConfig } from "@/components/QuizConfig";
import { MultipleChoice } from "@/components/MultipleChoice";
import { MatchingQuiz } from "@/components/MatchingQuiz";
import { QuizResults } from "@/components/QuizResults";
import { useQuizSession } from "@/hooks/useQuizSession";
import type { QuizConfig as QuizConfigType } from "@/types/quiz";

function App() {
  const { session, results, error, startQuiz, submitAnswer, nextQuestion, resetQuiz } =
    useQuizSession();

  const handleRetry = useCallback(() => {
    if (session?.config) {
      startQuiz(session.config);
    }
  }, [session?.config, startQuiz]);

  const handleStart = useCallback(
    (config: QuizConfigType) => {
      startQuiz(config);
    },
    [startQuiz],
  );

  function renderContent() {
    // Error state (checked first — session may be null on error)
    if (error) {
      return (
        <div className="rounded-xl bg-white p-8 shadow-sm space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={resetQuiz}
            className="rounded-lg border-2 border-gray-300 px-6 py-2 font-semibold text-gray-700 transition-colors hover:border-gray-400"
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
        <div className="rounded-xl bg-white p-12 shadow-sm text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-brand border-r-transparent" />
          <p className="mt-4 text-gray-500">Generating questions...</p>
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">drugs-quiz</h1>
                <p className="text-xs text-gray-400">Pharmacy exam prep</p>
              </div>
            </div>
            {session && (
              <button
                onClick={resetQuiz}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{renderContent()}</main>
    </div>
  );
}

export default App;
