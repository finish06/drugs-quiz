import { useState } from "react";
import type { QuizConfig, QuizType } from "@/types/quiz";

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
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

export function QuizConfig({ onStart }: QuizConfigProps) {
  const [selectedType, setSelectedType] = useState<QuizType>("name-the-class");
  const [questionCount, setQuestionCount] = useState<number>(10);

  function handleStart() {
    onStart({ type: selectedType, questionCount });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quiz Type</h2>
        <div className="grid gap-3">
          {QUIZ_TYPES.map((qt) => (
            <button
              key={qt.value}
              onClick={() => setSelectedType(qt.value)}
              className={`text-left rounded-lg border-2 p-4 transition-all duration-200 ${
                selectedType === qt.value
                  ? "border-brand bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
              aria-pressed={selectedType === qt.value}
            >
              <div className="font-medium text-gray-900">{qt.label}</div>
              <div className="mt-1 text-sm text-gray-500">{qt.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Number of Questions
        </h2>
        <div className="flex gap-3">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 rounded-lg border-2 py-3 text-center font-medium transition-all duration-200 ${
                questionCount === count
                  ? "border-brand bg-blue-50 text-brand-dark"
                  : "border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
        className="w-full rounded-xl bg-brand py-3.5 text-lg font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md active:scale-[0.98]"
      >
        Start Quiz
      </button>
    </div>
  );
}
