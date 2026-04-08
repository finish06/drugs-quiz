import { useState } from "react";
import type { QuizConfig, QuizType, SessionRecord, SessionQuizType } from "@/types/quiz";
import { SessionHistory } from "./SessionHistory";
import { Quick5Button } from "./Quick5Button";

interface QuizConfigProps {
  onStart: (config: QuizConfig) => void;
  onQuick5?: (timedConfig?: { timedMode: boolean; timeLimitSeconds: 30 | 60 | 90 }) => void;
  sessions?: SessionRecord[];
  personalBest?: Partial<Record<SessionQuizType, number>>;
  isHistoryCollapsed?: boolean;
  onToggleHistoryCollapsed?: () => void;
  isLoading?: boolean;
  flaggedCount?: number;
  onReviewFlagged?: () => void;
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
const TIME_LIMITS = [30, 60, 90] as const;

export function QuizConfig({ onStart, onQuick5, sessions = [], personalBest = {}, isHistoryCollapsed = false, onToggleHistoryCollapsed, isLoading = false, flaggedCount = 0, onReviewFlagged }: QuizConfigProps) {
  const [selectedType, setSelectedType] = useState<QuizType>("name-the-class");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<30 | 60 | 90>(60);

  function handleStart() {
    onStart({
      type: selectedType,
      questionCount,
      ...(timedMode && { timedMode: true, timeLimitSeconds }),
    });
  }

  function handleQuick5() {
    if (onQuick5) {
      onQuick5(timedMode ? { timedMode: true, timeLimitSeconds } : undefined);
    }
  }

  return (
    <div className="space-y-8">
      {onQuick5 && <Quick5Button onStart={handleQuick5} />}

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

      {/* Timed Mode */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm transition-colors duration-150">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">Timed Mode</h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Countdown timer per question</p>
          </div>
          <button
            role="switch"
            aria-checked={timedMode}
            aria-label="Toggle timed mode"
            onClick={() => setTimedMode(!timedMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              timedMode ? "bg-brand" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                timedMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {timedMode && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Time per question</p>
            <div className="flex gap-3">
              {TIME_LIMITS.map((limit) => (
                <button
                  key={limit}
                  onClick={() => setTimeLimitSeconds(limit)}
                  className={`flex-1 rounded-lg border-2 py-2 text-center text-sm font-medium transition-all duration-200 ${
                    timeLimitSeconds === limit
                      ? "border-brand bg-blue-50 dark:bg-blue-900/30 text-brand-dark dark:text-brand-light"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  aria-pressed={timeLimitSeconds === limit}
                >
                  {limit}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={isLoading}
        data-umami-event="quiz-start"
        data-umami-event-type={selectedType}
        data-umami-event-questions={questionCount}
        data-umami-event-timed={timedMode ? timeLimitSeconds + "s" : "off"}
        className={`w-full rounded-xl py-3.5 text-lg font-semibold text-white shadow-sm transition-all duration-200 ${
          isLoading
            ? "bg-brand/60 cursor-not-allowed"
            : "bg-brand hover:bg-brand-dark dark:hover:bg-brand-light hover:shadow-md active:scale-[0.98]"
        }`}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting...
          </span>
        ) : (
          "Start Quiz"
        )}
      </button>

      {flaggedCount > 0 && onReviewFlagged && (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Flagged Questions</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{flaggedCount} question{flaggedCount !== 1 ? "s" : ""} saved for review</p>
              </div>
            </div>
            <button
              onClick={onReviewFlagged}
              className="rounded-lg border-2 border-amber-400 dark:border-amber-500 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              Review Flagged
            </button>
          </div>
        </div>
      )}

      <SessionHistory
        sessions={sessions}
        personalBest={personalBest}
        isCollapsed={isHistoryCollapsed}
        onToggleCollapsed={onToggleHistoryCollapsed ?? (() => {})}
      />
    </div>
  );
}
