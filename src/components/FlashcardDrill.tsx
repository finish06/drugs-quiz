import { useState } from "react";
import type { DrugPerformance } from "@/hooks/useDrugPerformance";

interface FlashcardDrillProps {
  weakDrugs: DrugPerformance[];
  onExit: () => void;
}

export function FlashcardDrill({ weakDrugs, onExit }: FlashcardDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const drug = weakDrugs[currentIndex % weakDrugs.length]!;

  function handleReveal() {
    setRevealed(true);
  }

  function handleNext() {
    setRevealed(false);
    setCurrentIndex((prev) => prev + 1);
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm space-y-6 text-center transition-colors duration-150">
      <div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Study Mode
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {(currentIndex % weakDrugs.length) + 1} of {weakDrugs.length} drugs
        </p>
      </div>

      <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8 min-h-[200px] flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {drug.displayName}
        </p>

        {!revealed ? (
          <button
            onClick={handleReveal}
            className="text-sm text-brand hover:text-brand-dark transition-colors"
          >
            Tap to reveal
          </button>
        ) : (
          <>
            <div className="text-gray-400 dark:text-gray-500">↓</div>
            <p className="text-lg font-medium text-brand">
              {drug.drugClass}
            </p>
          </>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        {revealed && (
          <button
            onClick={handleNext}
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md"
          >
            Next
          </button>
        )}
        <button
          onClick={onExit}
          className="rounded-xl border-2 border-gray-300 dark:border-gray-600 px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:border-gray-400 dark:hover:border-gray-500"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
