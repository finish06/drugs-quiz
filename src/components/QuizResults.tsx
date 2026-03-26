import { useState } from "react";
import type { QuizResults as QuizResultsType } from "@/types/quiz";
import { AnswerReviewSection } from "./AnswerReviewSection";

interface QuizResultsProps {
  results: QuizResultsType;
  quizTypeLabel?: string;
  onNewQuiz: () => void;
  onRetry: () => void;
  weakDrugCount?: number;
  onStudyWeakDrugs?: () => void;
}

export function QuizResults({ results, quizTypeLabel, onNewQuiz, onRetry, weakDrugCount, onStudyWeakDrugs }: QuizResultsProps) {
  const { totalQuestions, correctAnswers, percentage } = results;
  const [copied, setCopied] = useState(false);

  function getGradeColor(): string {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  function getGradeMessage(): string {
    if (percentage >= 90) return "Excellent!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Good work!";
    if (percentage >= 60) return "Not bad!";
    return "Keep practicing!";
  }

  function getShareText(): string {
    const label = quizTypeLabel || "Quiz";
    return `🎯 Rx Quiz: Scored ${percentage}% on ${label} (${correctAnswers}/${totalQuestions}) — drug-quiz.calebdunn.tech`;
  }

  async function handleShare() {
    const text = getShareText();

    // Try Web Share API first (mobile)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    if (typeof navigator.clipboard?.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard failed silently
      }
    }
  }

  const canShare = typeof navigator !== "undefined" &&
    (typeof navigator.share === "function" || typeof navigator.clipboard?.writeText === "function");

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

      <AnswerReviewSection answers={results.answers} />

      {onStudyWeakDrugs && weakDrugCount && weakDrugCount > 0 && (
        <button
          onClick={onStudyWeakDrugs}
          className="w-full rounded-xl border-2 border-brand py-3 font-semibold text-brand transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          Study Weak Drugs ({weakDrugCount} to review)
        </button>
      )}

      {canShare && (
        <button
          onClick={handleShare}
          aria-label="Share quiz results"
          className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 py-3 font-semibold text-gray-600 dark:text-gray-300 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            {copied ? "Copied!" : "Share Results"}
          </span>
        </button>
      )}

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
