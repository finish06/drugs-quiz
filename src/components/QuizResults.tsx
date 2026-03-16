import type { QuizResults as QuizResultsType } from "@/types/quiz";

interface QuizResultsProps {
  results: QuizResultsType;
  onNewQuiz: () => void;
  onRetry: () => void;
}

export function QuizResults({ results, onNewQuiz, onRetry }: QuizResultsProps) {
  const { totalQuestions, correctAnswers, percentage } = results;

  function getGradeColor(): string {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-amber-600";
    return "text-red-600";
  }

  function getGradeMessage(): string {
    if (percentage >= 90) return "Excellent!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Good work!";
    if (percentage >= 60) return "Not bad!";
    return "Keep practicing!";
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm space-y-8 text-center transition-colors duration-150">
      <div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-400 uppercase tracking-wide">
          Quiz Complete
        </p>
        <p className={`mt-3 text-6xl font-bold ${getGradeColor()}`}>
          {percentage}%
        </p>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{getGradeMessage()}</p>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalQuestions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {totalQuestions - correctAnswers}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Question Breakdown</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {results.answers.map((answer, index) => (
            <div
              key={index}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                answer.correct
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              }`}
              title={`Question ${index + 1}: ${answer.correct ? "Correct" : "Incorrect"}`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRetry}
          className="rounded-xl border-2 border-brand py-3 font-semibold text-brand transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          Retry
        </button>
        <button
          onClick={onNewQuiz}
          className="rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md"
        >
          New Quiz
        </button>
      </div>
    </div>
  );
}
