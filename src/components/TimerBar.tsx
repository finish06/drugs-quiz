interface TimerBarProps {
  secondsLeft: number;
  fraction: number;
  expired: boolean;
}

function getTimerColor(fraction: number): string {
  if (fraction > 0.5) return "bg-green-500";
  if (fraction > 0.25) return "bg-yellow-500";
  return "bg-red-500";
}

function getTextColor(fraction: number): string {
  if (fraction > 0.5) return "text-green-600 dark:text-green-400";
  if (fraction > 0.25) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export function TimerBar({ secondsLeft, fraction, expired }: TimerBarProps) {
  if (expired) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2">
        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">Time&apos;s up!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${getTimerColor(fraction)}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-semibold tabular-nums min-w-[2.5rem] text-right ${getTextColor(fraction)}`}>
        {secondsLeft}s
      </span>
    </div>
  );
}
