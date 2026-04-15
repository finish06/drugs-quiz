/**
 * useAchievements — dual-source hook for badge state.
 * Authenticated: reads from /api/achievements, checks via /api/achievements/check.
 * Guest: reads from localStorage under "rxdrill:achievements:v1".
 * Spec: specs/achievements-badges.md AC-009, AC-010, AC-011, AC-016
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

export const ACHIEVEMENTS_STORAGE_KEY = "rxdrill:achievements:v1";

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO string
  context: Record<string, unknown> | null;
}

export interface UseAchievementsReturn {
  earnedBadges: EarnedBadge[];
  isLoading: boolean;
  /** Authenticated only: POST /api/achievements/check after session save */
  checkAfterSession: (sessionId: string) => Promise<EarnedBadge[]>;
  /** Guest only: persist a newly-earned badge to localStorage */
  saveGuestBadge: (badgeId: string, earnedAt: Date) => void;
  /** Migrate localStorage badges to API on sign-in (AC-011) */
  migrateGuestBadges: () => Promise<void>;
  /** Refresh badge list from server */
  refresh: () => void;
}

function readGuestBadges(): EarnedBadge[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, string>;
    return Object.entries(data).map(([badgeId, earnedAt]) => ({
      badgeId,
      earnedAt,
      context: null,
    }));
  } catch {
    return [];
  }
}

function readGuestBadgeMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function useAchievements(): UseAchievementsReturn {
  const { isAuthenticated } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  // Load badges on mount / auth change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const res = await fetch("/api/achievements", { credentials: "include" });
          if (res.ok && !cancelled) {
            const data: EarnedBadge[] = await res.json();
            setEarnedBadges(data);
          }
        } else {
          if (!cancelled) {
            setEarnedBadges(readGuestBadges());
          }
        }
      } catch {
        // Network error — keep current state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, refreshTick]);

  /** POST /api/achievements/check — call after session save (authenticated path) */
  const checkAfterSession = useCallback(async (sessionId: string): Promise<EarnedBadge[]> => {
    try {
      const res = await fetch("/api/achievements/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const unlocked: EarnedBadge[] = data.unlocked ?? [];
      if (unlocked.length > 0) {
        // Append newly unlocked badges to local state
        setEarnedBadges((prev) => [
          ...unlocked,
          ...prev.filter((b) => !unlocked.some((u) => u.badgeId === b.badgeId)),
        ]);
      }
      return unlocked;
    } catch {
      // AC-016: Network failure doesn't block UX — return empty
      return [];
    }
  }, []);

  /** Save a guest badge to localStorage */
  const saveGuestBadge = useCallback((badgeId: string, earnedAt: Date) => {
    try {
      const current = readGuestBadgeMap();
      if (!current[badgeId]) {
        current[badgeId] = earnedAt.toISOString();
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(current));
        setEarnedBadges((prev) => [
          { badgeId, earnedAt: earnedAt.toISOString(), context: null },
          ...prev.filter((b) => b.badgeId !== badgeId),
        ]);
      }
    } catch {
      // localStorage unavailable — silently degrade
    }
  }, []);

  /** Migrate guest localStorage badges to API on sign-in (AC-011) */
  const migrateGuestBadges = useCallback(async () => {
    const guestMap = readGuestBadgeMap();
    const badges = Object.entries(guestMap).map(([badgeId, earnedAt]) => ({
      badgeId,
      earnedAt,
    }));
    if (badges.length === 0) return;

    try {
      const res = await fetch("/api/achievements/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ badges }),
      });
      if (res.ok) {
        // Clear localStorage on success — server is now authoritative (AC-011)
        localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
        refresh();
      }
    } catch {
      // Best effort — don't clear localStorage on failure
    }
  }, [refresh]);

  return {
    earnedBadges,
    isLoading,
    checkAfterSession,
    saveGuestBadge,
    migrateGuestBadges,
    refresh,
  };
}
