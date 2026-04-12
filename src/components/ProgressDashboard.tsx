import { useState } from "react";
import type { StatsData } from "@/types/stats";

const QUIZ_TYPE_LABELS: Record<string, string> = {
  "name-the-class": "Name the Class",
  "match-drug-to-class": "Match Drug to Class",
  "brand-generic-match": "Brand/Generic Match",
  "quick-5": "Quick 5",
};

interface ProgressDashboardProps {
  stats: StatsData;
  onBack: () => void;
  onRangeChange?: (days: number | null) => void;
  showSignInCta?: boolean;
  onSignIn?: () => void;
}

export function ProgressDashboard({
  stats,
  onBack,
  onRangeChange,
  showSignInCta,
  onSignIn,
}: ProgressDashboardProps) {
  const [activeRange, setActiveRange] = useState<number | null>(30);

  function handleRange(days: number | null) {
    setActiveRange(days);
    onRangeChange?.(days);
  }

  if (stats.totalQuizzes === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm text-center space-y-4">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 float-left">
          ← Back
        </button>
        <div className="clear-both pt-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Complete your first quiz to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          ← Back
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">My Progress</h2>
        <div className="w-10" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Accuracy" value={`${stats.overallAccuracy}%`} color="text-brand" />
        <MetricCard label="Quizzes" value={String(stats.totalQuizzes)} color="text-gray-900 dark:text-gray-100" />
        <MetricCard label="Questions" value={String(stats.totalQuestions)} color="text-gray-900 dark:text-gray-100" />
        <StreakCard streak={stats.currentStreak} longest={stats.longestStreak} />
      </div>

      {/* Trend chart */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accuracy Trend</h3>
          <div className="flex gap-1">
            {([
              [7, "7d"],
              [30, "30d"],
              [null, "All"],
            ] as const).map(([days, label]) => (
              <button
                key={label}
                onClick={() => handleRange(days)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeRange === days
                    ? "bg-brand text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart data={stats.trendData} />
      </div>

      {/* Weak + Strong classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ClassList title="Weakest Classes" classes={stats.weakestClasses} emptyText="No weak areas — great work!" colorFn={(a) => a < 50 ? "text-red-500" : "text-amber-500"} />
        <ClassList title="Strongest Classes" classes={stats.strongestClasses} emptyText="Not enough data yet" colorFn={() => "text-green-500"} />
      </div>

      {/* Quiz type breakdown */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quiz Type Breakdown</h3>
        <div className="space-y-3">
          {stats.quizTypeBreakdown.map((qt) => (
            <div key={qt.quizType} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-36 truncate">
                {QUIZ_TYPE_LABELS[qt.quizType] || qt.quizType}
              </span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${qt.accuracy}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-12 text-right">
                {Math.round(qt.accuracy)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign in CTA */}
      {showSignInCta && (
        <div className="rounded-xl border-2 border-dashed border-brand/30 bg-blue-50 dark:bg-blue-900/10 p-4 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Sign in to unlock your full history and sync across devices
          </p>
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function StreakCard({ streak }: { streak: number; longest: number }) {
  const milestones = [3, 7, 14, 30];
  const currentMilestone = milestones.filter((m) => streak >= m).pop();

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm text-center">
      <p className="text-2xl font-bold text-orange-500">{streak}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        🔥 Streak
      </p>
      {currentMilestone && (
        <p className="text-xs text-orange-400 mt-1">{currentMilestone}-day milestone!</p>
      )}
    </div>
  );
}

function ClassList({
  title,
  classes,
  emptyText,
  colorFn,
}: {
  title: string;
  classes: Array<{ className: string; accuracy: number; totalSeen: number }>;
  emptyText: string;
  colorFn: (accuracy: number) => string;
}) {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      {classes.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {classes.map((cls) => (
            <li key={cls.className} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{cls.className}</span>
              <span className={`font-semibold ${colorFn(cls.accuracy)}`}>{Math.round(cls.accuracy)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrendChart({ data }: { data: Array<{ date: string; accuracy: number; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-8">Not enough data for a trend yet</p>;
  }

  const width = 500;
  const height = 150;
  const padding = { top: 10, right: 10, bottom: 20, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minAcc = Math.max(0, Math.min(...data.map((d) => d.accuracy)) - 10);
  const maxAcc = Math.min(100, Math.max(...data.map((d) => d.accuracy)) + 10);
  const range = maxAcc - minAcc || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
    y: padding.top + chartH - ((d.accuracy - minAcc) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis labels */}
      <text x={padding.left - 5} y={padding.top + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
        {Math.round(maxAcc)}%
      </text>
      <text x={padding.left - 5} y={height - padding.bottom} textAnchor="end" className="fill-gray-400 text-[10px]">
        {Math.round(minAcc)}%
      </text>

      {/* Grid line */}
      <line
        x1={padding.left} y1={padding.top + chartH / 2}
        x2={width - padding.right} y2={padding.top + chartH / 2}
        stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4"
      />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5">
          <title>{p.date}: {p.accuracy}% ({p.count} questions)</title>
        </circle>
      ))}

      {/* X-axis labels (first and last) */}
      {data.length > 1 && (
        <>
          <text x={padding.left} y={height - 4} textAnchor="start" className="fill-gray-400 text-[9px]">
            {data[0]?.date.slice(5)}
          </text>
          <text x={width - padding.right} y={height - 4} textAnchor="end" className="fill-gray-400 text-[9px]">
            {data[data.length - 1]?.date.slice(5)}
          </text>
        </>
      )}
    </svg>
  );
}
