import { useState } from "react";
import type { MultipleChoiceQuestion } from "@/types/quiz";
import { AnswerFeedback } from "./AnswerFeedback";

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
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
    onAnswer(option === question.correctAnswer, option);
  }

  function getOptionStyle(option: string): string {
    const base = "w-full text-left rounded-lg border-2 p-4 transition-all duration-200";

    if (!answered) {
      return `${base} border-gray-200 dark:border-gray-700 hover:border-brand-muted dark:hover:border-brand-muted hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm`;
    }

    if (option === question.correctAnswer) {
      return `${base} border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-300 shadow-sm`;
    }

    if (option === selectedOption && option !== question.correctAnswer) {
      return `${base} border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-300`;
    }

    return `${base} border-gray-200 dark:border-gray-700 opacity-50`;
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6 transition-colors duration-150">
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-brand transition-all duration-300"
            style={{ width: `${((questionNumber - 1 + (answered ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          What class does this drug belong to?
        </p>
        <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{question.drugName}</p>
      </div>

      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            title={option}
            className={getOptionStyle(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <>
          <AnswerFeedback
            correct={selectedOption === question.correctAnswer}
            drugName={question.drugName}
            correctClass={question.correctAnswer}
          />
          <button
            onClick={onNext}
            className="w-full rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md"
          >
            {questionNumber === totalQuestions ? "See Results" : "Next Question"}
          </button>
        </>
      )}
    </div>
  );
}
