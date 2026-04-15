/**
 * BadgesPage — displays all 5 badges (earned + locked) with earn-dates.
 * Spec: specs/achievements-badges.md AC-013, AC-010
 * UX: specs/ux/achievements-badges-ux.md Screen 1
 *
 * Grid: grid-cols-2 lg:grid-cols-3 gap-4
 * Earned: colored icon, accent bg, earn-date
 * Locked: greyscale icon, muted bg, criteria text
 */

import { useEffect } from "react";
import { Trophy, Target, Award, Medal, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BADGE_CATALOG } from "@/data/badges";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

interface BadgesPageProps {
  onBack?: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Award,
  Medal,
  Flame,
};

function formatEarnDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function BadgesPage({ onBack }: BadgesPageProps) {
  const { earnedBadges, isLoading } = useAchievements();
  const { isAuthenticated, login } = useAuth();

  // AC-017: emit badges_viewed analytics on page load
  useEffect(() => {
    window.umami?.track("badges_viewed");
  }, []);

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));
  const earnedBadgesList = BADGE_CATALOG.filter((b) => earnedIds.has(b.id));
  const lockedBadgesList = BADGE_CATALOG.filter((b) => !earnedIds.has(b.id));

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Back
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Badges</h1>
      </div>

      {/* Guest banner (AC-010) */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-amber-800 dark:text-amber-200">
            Sign in to keep your badges across devices.
          </span>
          <button
            onClick={login}
            className="text-sm font-semibold text-amber-900 dark:text-amber-100 underline whitespace-nowrap"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Empty state encouragement */}
      {earnedBadgesList.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
          Complete a quiz to earn your first badge!
        </p>
      )}

      {/* Earned section */}
      {earnedBadgesList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Your Achievements
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {earnedBadgesList.length} of {BADGE_CATALOG.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadgesList.map((badge) => {
              const earned = earnedBadges.find((b) => b.badgeId === badge.id);
              const Icon = ICON_MAP[badge.icon] ?? Trophy;
              return (
                <div
                  key={badge.id}
                  className="rounded-2xl p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 ring-1 ring-yellow-300/40 dark:ring-yellow-600/30 flex flex-col items-center gap-2 text-center"
                >
                  <Icon
                    className="h-8 w-8 text-yellow-500"
                    aria-label={badge.name}
                  />
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {badge.name}
                  </p>
                  {earned && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatEarnDate(earned.earnedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Locked section */}
      {lockedBadgesList.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Locked
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedBadgesList.map((badge) => {
              const Icon = ICON_MAP[badge.icon] ?? Trophy;
              return (
                <div
                  key={badge.id}
                  className="rounded-2xl p-4 bg-gray-100 dark:bg-gray-800 flex flex-col items-center gap-2 text-center"
                >
                  <Icon
                    className="h-8 w-8 text-gray-400 dark:text-gray-600"
                    aria-label={badge.name}
                  />
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                    {badge.criteria}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
