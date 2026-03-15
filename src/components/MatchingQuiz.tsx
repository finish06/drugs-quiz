import { useState } from "react";
import type { MatchingQuestion } from "@/types/quiz";

interface MatchingQuizProps {
  question: MatchingQuestion;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
  leftLabel: string;
  rightLabel: string;
}

const PAIR_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-800" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-800" },
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800" },
  { bg: "bg-teal-100", border: "border-teal-400", text: "text-teal-800" },
];

export function MatchingQuiz({
  question,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
  leftLabel,
  rightLabel,
}: MatchingQuizProps) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pairedLeftItems = new Set(Object.keys(pairs));
  const pairedRightItems = new Set(Object.values(pairs));

  function handleLeftClick(item: string) {
    if (submitted) return;

    if (pairedLeftItems.has(item)) {
      // Undo this pair
      const newPairs = { ...pairs };
      delete newPairs[item];
      setPairs(newPairs);
      return;
    }

    setSelectedLeft(item);
  }

  function handleRightClick(item: string) {
    if (submitted || !selectedLeft) return;

    if (pairedRightItems.has(item)) {
      // Undo existing pair using this right item
      const newPairs = { ...pairs };
      for (const [key, value] of Object.entries(newPairs)) {
        if (value === item) {
          delete newPairs[key];
          break;
        }
      }
      setPairs(newPairs);
    }

    setPairs((prev) => ({ ...prev, [selectedLeft]: item }));
    setSelectedLeft(null);
  }

  function handleSubmit() {
    setSubmitted(true);
    const correctCount = Object.entries(pairs).filter(
      ([left, right]) => question.correctPairs[left] === right,
    ).length;
    onAnswer(correctCount === question.leftItems.length);
  }

  function getPairIndex(item: string, side: "left" | "right"): number {
    const entries = Object.entries(pairs);
    for (let i = 0; i < entries.length; i++) {
      if (side === "left" && entries[i]![0] === item) return i;
      if (side === "right" && entries[i]![1] === item) return i;
    }
    return -1;
  }

  function getItemStyle(item: string, side: "left" | "right"): string {
    const base = "w-full text-left rounded-lg border-2 p-3 transition-colors text-sm";
    const pairIdx = getPairIndex(item, side);

    if (submitted) {
      if (side === "left" && pairedLeftItems.has(item)) {
        const isCorrect = question.correctPairs[item] === pairs[item];
        return `${base} ${isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`;
      }
      if (side === "right" && pairedRightItems.has(item)) {
        const leftKey = Object.entries(pairs).find(([, v]) => v === item)?.[0];
        const isCorrect = leftKey ? question.correctPairs[leftKey] === item : false;
        return `${base} ${isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`;
      }
      return `${base} border-gray-200 opacity-50`;
    }

    if (pairIdx >= 0) {
      const color = PAIR_COLORS[pairIdx % PAIR_COLORS.length]!;
      return `${base} ${color.border} ${color.bg} ${color.text}`;
    }

    if (side === "left" && selectedLeft === item) {
      return `${base} border-blue-500 bg-blue-50 ring-2 ring-blue-300`;
    }

    return `${base} border-gray-200 hover:border-gray-300`;
  }

  const allPaired = Object.keys(pairs).length === question.leftItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wide">
        Match each item on the left with its pair on the right
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase">
            {leftLabel}
          </p>
          <div className="space-y-2">
            {question.leftItems.map((item) => (
              <button
                key={item}
                onClick={() => handleLeftClick(item)}
                disabled={submitted}
                className={getItemStyle(item, "left")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase">
            {rightLabel}
          </p>
          <div className="space-y-2">
            {question.rightItems.map((item) => (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={submitted || !selectedLeft}
                className={getItemStyle(item, "right")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {submitted && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Correct answers:</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {Object.entries(question.correctPairs).map(([left, right]) => (
              <li key={left}>
                {left} → {right}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!submitted && allPaired && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
        >
          Check Answers
        </button>
      )}

      {submitted && (
        <button
          onClick={onNext}
          className="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
        >
          {questionNumber === totalQuestions ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}
