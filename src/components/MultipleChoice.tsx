import { useState, useEffect, useCallback } from "react";
import type { MultipleChoiceQuestion } from "@/types/quiz";
import { AnswerFeedback } from "./AnswerFeedback";

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  onAnswer: (correct: boolean, userAnswer: string) => void;
  onNext: () => void;
  onExit?: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function MultipleChoice({
  question,
  onAnswer,
  onNext,
  onExit,
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if any modifier is held (don't interfere with browser shortcuts)
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

    // Ignore if focus is in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

    if (!answered) {
      // Number keys 1-4 select answer
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= question.options.length) {
        e.preventDefault();
        handleSelect(question.options[num - 1]!);
      }
    }

    if (answered && e.key === "Enter") {
      e.preventDefault();
      onNext();
    }

    if (e.key === "Escape" && onExit) {
      e.preventDefault();
      onExit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, question.options, onNext, onExit]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
        {question.options.map((option, idx) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={answered}
            title={option}
            className={getOptionStyle(option)}
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-400 dark:text-gray-500"
              >
                {idx + 1}
              </span>
              <span>{option}</span>
            </span>
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
            {answered && (
              <span className="ml-2 text-xs opacity-70">Enter ↵</span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
