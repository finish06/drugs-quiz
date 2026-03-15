import { useState } from "react";
import type { MultipleChoiceQuestion } from "@/types/quiz";

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function MultipleChoice({
  question,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
}: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(option: string) {
    if (answered) return;

    setSelectedOption(option);
    setAnswered(true);
    onAnswer(option === question.correctAnswer);
  }

  function getOptionStyle(option: string): string {
    const base = "w-full text-left rounded-lg border-2 p-4 transition-colors";

    if (!answered) {
      return `${base} border-gray-200 hover:border-blue-300 hover:bg-blue-50`;
    }

    if (option === question.correctAnswer) {
      return `${base} border-green-500 bg-green-50 text-green-900`;
    }

    if (option === selectedOption && option !== question.correctAnswer) {
      return `${base} border-red-500 bg-red-50 text-red-900`;
    }

    return `${base} border-gray-200 opacity-50`;
  }

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

      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          What class does this drug belong to?
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{question.drugName}</p>
      </div>

      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            className={getOptionStyle(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
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
