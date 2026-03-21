import { useState } from "react";
import type { AnswerDetail } from "@/types/quiz";

interface AnswerReviewSectionProps {
  answers: AnswerDetail[];
}

export function AnswerReviewSection({ answers }: AnswerReviewSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span>Review Answers</span>
        <span className="text-gray-400">{collapsed ? "▶" : "▼"}</span>
      </button>

      <div style={{ display: collapsed ? "none" : "block" }} className="mt-3 space-y-3">
        {answers.map((answer, index) => (
          <ReviewEntry key={index} answer={answer} index={index} />
        ))}
      </div>
    </div>
  );
}

function ReviewEntry({ answer, index }: { answer: AnswerDetail; index: number }) {
  const { question, correct, userAnswer } = answer;

  if (question.kind === "multiple-choice") {
    return (
      <div className={`flex items-start gap-2 text-sm ${correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
        <span className="font-medium shrink-0">{index + 1}.</span>
        <span className="shrink-0">{correct ? "✓" : "✗"}</span>
        <div>
          <span className="font-medium">{question.drugName}</span>
          {" → "}
          {correct ? (
            <span>{question.correctAnswer}</span>
          ) : (
            <span>
              You said: {userAnswer as string} | Correct: {question.correctAnswer}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (question.kind === "matching") {
    const pairs = userAnswer as Record<string, string>;
    const totalPairs = Object.keys(question.correctPairs).length;
    const correctCount = Object.entries(pairs).filter(
      ([left, right]) => question.correctPairs[left] === right,
    ).length;

    const missedPairs = Object.entries(question.correctPairs).filter(
      ([left, right]) => pairs[left] !== right,
    );

    return (
      <div className={`flex items-start gap-2 text-sm ${correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
        <span className="font-medium shrink-0">{index + 1}.</span>
        <span className="shrink-0">{correct ? "✓" : "✗"}</span>
        <div>
          <span>Match — {correctCount}/{totalPairs} correct</span>
          {missedPairs.length > 0 && (
            <ul className="mt-1 ml-2 text-xs text-gray-500 dark:text-gray-400">
              {missedPairs.map(([left, right]) => (
                <li key={left}>Missed: {left} → {right}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return null;
}
