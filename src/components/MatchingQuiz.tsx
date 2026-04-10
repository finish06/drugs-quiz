import { useState, useMemo, useRef, useEffect } from "react";
import type { MatchingQuestion } from "@/types/quiz";
import { TimerBar } from "./TimerBar";
import { FlagButton } from "./FlagButton";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";

interface MatchingQuizProps {
  question: MatchingQuestion;
  onAnswer: (correct: boolean, userAnswer: Record<string, string>, timeSpent?: number, timedOut?: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
  leftLabel: string;
  rightLabel: string;
  timeLimitSeconds?: number;
  flagged?: boolean;
  onToggleFlag?: () => void;
}

const PAIR_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-400", text: "text-blue-800 dark:text-blue-300" },
  { bg: "bg-purple-100 dark:bg-purple-900/40", border: "border-purple-400", text: "text-purple-800 dark:text-purple-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-400", text: "text-amber-800 dark:text-amber-300" },
  { bg: "bg-teal-100 dark:bg-teal-900/40", border: "border-teal-400", text: "text-teal-800 dark:text-teal-300" },
];

export function MatchingQuiz({
  question,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
  leftLabel,
  rightLabel,
  timeLimitSeconds,
  flagged = false,
  onToggleFlag,
}: MatchingQuizProps) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(0);
  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  const isTimed = typeof timeLimitSeconds === "number" && timeLimitSeconds > 0;

  function handleTimerExpire() {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(false, { ...pairs }, timeLimitSeconds!, true);
    setTimeout(() => onNext(), 1500);
  }

  const timer = useQuestionTimer({
    totalSeconds: timeLimitSeconds || 60,
    onExpire: handleTimerExpire,
    active: isTimed && !submitted,
  });

  const pairedLeftItems = useMemo(() => new Set(Object.keys(pairs)), [pairs]);
  const pairedRightItems = useMemo(() => new Set(Object.values(pairs)), [pairs]);

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
    if (submitted) return;

    // If no left item selected, select this right item's paired left item for undo,
    // or ignore the click
    if (!selectedLeft) return;

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
    if (isTimed) timer.stop();
    const timeSpent = (Date.now() - startTimeRef.current) / 1000;

    setSubmitted(true);
    const correctCount = Object.entries(pairs).filter(
      ([left, right]) => question.correctPairs[left] === right,
    ).length;
    onAnswer(
      correctCount === question.leftItems.length,
      { ...pairs },
      isTimed ? Math.round(timeSpent) : undefined,
      false,
    );
  }

  function getPairIndex(item: string, side: "left" | "right"): number {
    const entries = Object.entries(pairs);
    for (let i = 0; i < entries.length; i++) {
      if (side === "left" && entries[i]![0] === item) return i;
      if (side === "right" && entries[i]![1] === item) return i;
    }
    return -1;
  }

  type ItemState = "correct" | "incorrect" | "submitted-unpaired" | "paired" | "selected" | "hoverable" | "default";

  function getItemState(item: string, side: "left" | "right"): ItemState {
    if (submitted) {
      const isPaired = side === "left" ? pairedLeftItems.has(item) : pairedRightItems.has(item);
      if (!isPaired) return "submitted-unpaired";
      return isCorrectPair(item, side) ? "correct" : "incorrect";
    }
    if (getPairIndex(item, side) >= 0) return "paired";
    if (side === "left" && selectedLeft === item) return "selected";
    if (side === "right" && selectedLeft && !pairedRightItems.has(item)) return "hoverable";
    return "default";
  }

  function isCorrectPair(item: string, side: "left" | "right"): boolean {
    if (side === "left") return question.correctPairs[item] === pairs[item];
    const leftKey = Object.entries(pairs).find(([, v]) => v === item)?.[0];
    return leftKey ? question.correctPairs[leftKey] === item : false;
  }

  const ITEM_STATE_STYLES: Record<ItemState, string> = {
    correct: "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-300 shadow-sm",
    incorrect: "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-300",
    "submitted-unpaired": "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-400 opacity-50",
    paired: "", // handled separately — needs color index
    selected: "border-brand dark:border-brand bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 ring-2 ring-brand-muted dark:ring-brand-muted",
    hoverable: "border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-brand dark:hover:border-brand hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm cursor-pointer",
    default: "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm",
  };

  function getItemStyle(item: string, side: "left" | "right"): string {
    const base = "w-full text-left rounded-lg border-2 p-3 transition-all duration-200 text-sm";
    const state = getItemState(item, side);

    if (state === "paired") {
      const color = PAIR_COLORS[getPairIndex(item, side) % PAIR_COLORS.length]!;
      return `${base} ${color.border} ${color.bg} ${color.text} shadow-sm`;
    }

    return `${base} ${ITEM_STATE_STYLES[state]}`;
  }

  const allPaired = Object.keys(pairs).length === question.leftItems.length;
  const pairCount = Object.keys(pairs).length;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm space-y-6 transition-colors duration-150">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <span className="shrink-0">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-brand transition-all duration-300"
            style={{ width: `${((questionNumber - 1 + (submitted ? 1 : 0)) / totalQuestions) * 100}%` }}
          />
        </div>
        {onToggleFlag && <FlagButton flagged={flagged} onToggle={onToggleFlag} />}
      </div>

      {isTimed && (
        <TimerBar secondsLeft={timer.secondsLeft} fraction={timer.fraction} expired={timer.expired} />
      )}

      {!submitted && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          {selectedLeft ? (
            <span className="text-brand dark:text-brand-light font-medium">
              Now tap a match on the right →
            </span>
          ) : pairCount > 0 && !allPaired ? (
            <span>
              {pairCount} of {question.leftItems.length} matched — tap left to continue
            </span>
          ) : allPaired ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              All matched! Check your answers below
            </span>
          ) : (
            <span>Tap an item on the left, then tap its match on the right</span>
          )}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            {leftLabel}
          </p>
          <div className="space-y-2">
            {question.leftItems.map((item) => (
              <button
                key={item}
                onClick={() => handleLeftClick(item)}
                disabled={submitted}
                title={item}
                className={`${getItemStyle(item, "left")} min-h-[3.5rem]`}
              >
                <span className="line-clamp-2 overflow-hidden">{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            {rightLabel}
          </p>
          <div className="space-y-2">
            {question.rightItems.map((item) => (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={submitted}
                title={item}
                className={`${getItemStyle(item, "right")} min-h-[3.5rem]`}
              >
                <span className="line-clamp-2 overflow-hidden">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {submitted && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correct answers:</p>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {Object.entries(question.correctPairs).map(([left, right]) => (
              <li key={left}>
                <span className="font-medium">{left}</span> → {right}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!submitted && allPaired && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md"
        >
          Check Answers
        </button>
      )}

      {submitted && (
        <button
          onClick={onNext}
          className="w-full rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md"
        >
          {questionNumber === totalQuestions ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}
