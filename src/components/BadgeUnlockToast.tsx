/**
 * BadgeUnlockToast — fixed top-right toasts for badge unlocks.
 * Spec: specs/achievements-badges.md AC-012, AC-018
 * UX: specs/ux/achievements-badges-ux.md Screen 2
 *
 * Position: fixed top-4 right-4 (mobile: top-4 left-2 right-2)
 * Duration: 5s auto-dismiss per toast
 * Stacking: 300ms stagger between each toast
 * A11y: role="status", aria-live="polite", icon aria-hidden, visible text
 */

import { useEffect, useRef } from "react";
import { Trophy, Target, Award, Medal, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BADGE_CATALOG } from "@/data/badges";

interface BadgeUnlock {
  badgeId: string;
  earnedAt: string;
  context: Record<string, unknown> | null;
}

interface BadgeUnlockToastProps {
  badges: BadgeUnlock[];
  onDismiss: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Award,
  Medal,
  Flame,
};

const AUTO_DISMISS_MS = 5000;
const STAGGER_MS = 300;

export function BadgeUnlockToast({ badges, onDismiss }: BadgeUnlockToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (badges.length === 0) return;

    // Auto-dismiss after 5s (plus stagger for all badges)
    const total = AUTO_DISMISS_MS + (badges.length - 1) * STAGGER_MS;
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, total);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [badges, onDismiss]);

  if (badges.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 left-auto z-50 flex flex-col gap-2 sm:left-auto sm:w-auto left-2 right-2"
    >
      {badges.map((badge, index) => {
        const def = BADGE_CATALOG.find((b) => b.id === badge.badgeId);
        const name = def?.name ?? badge.badgeId;
        const iconName = def?.icon ?? "Trophy";
        const Icon = ICON_MAP[iconName] ?? Trophy;

        return (
          <div
            key={badge.badgeId}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 min-w-[220px]"
            style={{
              animationDelay: `${index * STAGGER_MS}ms`,
            }}
          >
            <Icon
              className="h-5 w-5 text-yellow-500 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {name} unlocked!
              </p>
            </div>
            <button
              onClick={onDismiss}
              aria-label={`Dismiss ${name} badge notification`}
              className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
