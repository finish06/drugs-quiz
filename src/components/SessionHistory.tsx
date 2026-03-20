import type { SessionRecord, SessionQuizType } from "@/types/quiz";

interface SessionHistoryProps {
  sessions: SessionRecord[];
  personalBest: Partial<Record<SessionQuizType, number>>;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

const QUIZ_TYPE_LABELS: Record<SessionQuizType, string> = {
  "name-the-class": "Name the Class",
  "match-drug-to-class": "Match Drug to Class",
  "brand-generic-match": "Brand/Generic Match",
  "quick-5": "Quick 5",
};

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function SessionHistory({ sessions, personalBest, isCollapsed, onToggleCollapsed }: SessionHistoryProps) {
  const bestEntries = Object.entries(personalBest) as [SessionQuizType, number][];

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm transition-colors duration-150">
      <button
        onClick={onToggleCollapsed}
        className="w-full flex items-center justify-between p-6 text-left"
        aria-expanded={!isCollapsed}
      >
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wide">
          Recent Sessions
        </h2>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="px-6 pb-6 space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Complete your first quiz to start tracking progress
            </p>
          ) : (
            <>
              {bestEntries.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                  {bestEntries.map(([type, pct]) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-brand-dark dark:text-brand-light"
                    >
                      {QUIZ_TYPE_LABELS[type]}: {pct}%
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {QUIZ_TYPE_LABELS[s.quizType]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatRelativeDate(s.completedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {s.correctCount}/{s.questionCount}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
