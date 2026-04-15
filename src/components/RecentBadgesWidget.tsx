/**
 * RecentBadgesWidget — shows last 3 earned badges in the progress dashboard.
 * Spec: specs/achievements-badges.md AC-014
 * UX: specs/ux/achievements-badges-ux.md Screen 3
 *
 * Hidden when user has 0 badges (reduces dashboard clutter for new users).
 */

import { Trophy, Target, Award, Medal, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BADGE_CATALOG } from "@/data/badges";

interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  context: Record<string, unknown> | null;
}

interface RecentBadgesWidgetProps {
  badges: EarnedBadge[];
  onViewAll: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Award,
  Medal,
  Flame,
};

function formatShortDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const today = new Date();
    if (
      d.getUTCFullYear() === today.getUTCFullYear() &&
      d.getUTCMonth() === today.getUTCMonth() &&
      d.getUTCDate() === today.getUTCDate()
    ) {
      return "Today";
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RecentBadgesWidget({ badges, onViewAll }: RecentBadgesWidgetProps) {
  // Hidden when 0 badges (AC-014)
  if (badges.length === 0) return null;

  // Show up to 3 most recent (badges should already be sorted newest-first)
  const recent = badges.slice(0, 3);

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Badges</h3>
        <button
          onClick={onViewAll}
          className="text-xs text-brand hover:text-brand-dark dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
        >
          View all →
        </button>
      </div>
      <div className="flex gap-4">
        {recent.map((badge) => {
          const def = BADGE_CATALOG.find((b) => b.id === badge.badgeId);
          const iconName = def?.icon ?? "Trophy";
          const name = def?.name ?? badge.badgeId;
          const Icon = ICON_MAP[iconName] ?? Trophy;

          return (
            <div key={badge.badgeId} className="flex flex-col items-center gap-1 min-w-0">
              <Icon
                className="h-7 w-7 text-yellow-500 flex-shrink-0"
                aria-label={name}
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {formatShortDate(badge.earnedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
