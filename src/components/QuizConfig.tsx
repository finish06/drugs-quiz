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
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz Type</h2>
        <div className="grid gap-3">
          {QUIZ_TYPES.map((qt) => (
            <button
              key={qt.value}
              onClick={() => setSelectedType(qt.value)}
              className={`text-left rounded-lg border-2 p-4 transition-colors ${
                selectedType === qt.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-pressed={selectedType === qt.value}
            >
              <div className="font-medium text-gray-900">{qt.label}</div>
              <div className="mt-1 text-sm text-gray-500">{qt.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Number of Questions
        </h2>
        <div className="flex gap-3">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 rounded-lg border-2 py-3 text-center font-medium transition-colors ${
                questionCount === count
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
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
        className="w-full rounded-lg bg-blue-500 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
      >
        Start Quiz
      </button>
    </div>
  );
}
