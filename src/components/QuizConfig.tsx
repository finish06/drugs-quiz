import { useState } from "react";
import type { QuizConfig, QuizType, SessionRecord, SessionQuizType } from "@/types/quiz";
import { SessionHistory } from "./SessionHistory";
import { Quick5Button } from "./Quick5Button";

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
  onQuick5?: () => void;
  sessions?: SessionRecord[];
  personalBest?: Partial<Record<SessionQuizType, number>>;
  isHistoryCollapsed?: boolean;
  onToggleHistoryCollapsed?: () => void;
}

const QUIZ_TYPES: { value: QuizType; label: string; description: string }[] = [
  {
    value: "name-the-class",
    label: "Name the Class",
    description: "Given a drug name, identify its pharmacological class",
  },
  {
    value: "match-drug-to-class",
    label: "Match Drug to Class",
    description: "Match 4 drugs to their correct classes",
  },
  {
    value: "brand-generic-match",
    label: "Brand/Generic Match",
    description: "Match generic names to their brand name equivalents",
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20] as const;

export function QuizConfig({ onStart, onQuick5, sessions = [], personalBest = {}, isHistoryCollapsed = false, onToggleHistoryCollapsed }: QuizConfigProps) {
  const [selectedType, setSelectedType] = useState<QuizType>("name-the-class");
  const [questionCount, setQuestionCount] = useState<number>(10);

  function handleStart() {
    onStart({ type: selectedType, questionCount });
  }

  return (
    <div className="space-y-8">
      {onQuick5 && <Quick5Button onStart={onQuick5} />}

      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm transition-colors duration-150">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-4">Quiz Type</h2>
        <div className="grid gap-3">
          {QUIZ_TYPES.map((qt) => (
            <button
              key={qt.value}
              onClick={() => setSelectedType(qt.value)}
              className={`text-left rounded-lg border-2 p-4 transition-all duration-200 ${
                selectedType === qt.value
                  ? "border-brand bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
              }`}
              aria-pressed={selectedType === qt.value}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{qt.label}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{qt.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm transition-colors duration-150">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide mb-4">
          Number of Questions
        </h2>
        <div className="flex gap-3">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 rounded-lg border-2 py-3 text-center font-medium transition-all duration-200 ${
                questionCount === count
                  ? "border-brand bg-blue-50 dark:bg-blue-900/30 text-brand-dark dark:text-brand-light"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
              }`}
              aria-pressed={questionCount === count}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full rounded-xl bg-brand py-3.5 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark dark:hover:bg-brand-light hover:shadow-md active:scale-[0.98]"
      >
        Start Quiz
      </button>

      <SessionHistory
        sessions={sessions}
        personalBest={personalBest}
        isCollapsed={isHistoryCollapsed}
        onToggleCollapsed={onToggleHistoryCollapsed ?? (() => {})}
      />
    </div>
  );
}
