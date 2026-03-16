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
    <div className="rounded-xl bg-white p-8 shadow-sm space-y-8 text-center">
      <div>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Quiz Complete
        </p>
        <p className={`mt-3 text-6xl font-bold ${getGradeColor()}`}>
          {percentage}%
        </p>
        <p className="mt-2 text-lg text-gray-500">{getGradeMessage()}</p>
      </div>

      <div className="rounded-lg bg-gray-50 p-6 border border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
            <p className="text-sm text-gray-500">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {totalQuestions - correctAnswers}
            </p>
            <p className="text-sm text-gray-500">Incorrect</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Question Breakdown</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {results.answers.map((answer, index) => (
            <div
              key={index}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                answer.correct
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
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
          className="rounded-xl border-2 border-brand py-3 font-semibold text-brand transition-all duration-200 hover:bg-blue-50"
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
