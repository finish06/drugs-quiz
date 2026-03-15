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
        <div className="space-y-4 text-center">
          <p className="text-red-600 font-medium">Something went wrong</p>
          <p className="text-sm text-gray-500">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetQuiz}
              className="rounded-lg border-2 border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:border-gray-400"
            >
              Back
            </button>
          </div>
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
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
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
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">drugs-quiz</h1>
              <p className="mt-1 text-sm text-gray-500">
                Pharmacy exam prep
              </p>
            </div>
            {session && (
              <button
                onClick={resetQuiz}
                className="text-sm text-gray-400 hover:text-gray-600"
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
