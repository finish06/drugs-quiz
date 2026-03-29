import { useState, useCallback, useMemo } from "react";
import { changelog, appVersion } from "@/generated/changelog";
import type { ChangelogEntry } from "@/types/changelog";

const SEEN_KEY = "dq-changelog-seen";

function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function isNewer(current: string, seen: string | null): boolean {
  if (!seen) return true;
  const c = current.split(".").map(Number);
  const s = seen.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) > (s[i] ?? 0)) return true;
    if ((c[i] ?? 0) < (s[i] ?? 0)) return false;
  }
  return false;
}

export interface UseChangelogReturn {
  changelog: ChangelogEntry[];
  appVersion: string;
  hasUnseen: boolean;
  markSeen: () => void;
}

export function useChangelog(): UseChangelogReturn {
  const [lastSeen, setLastSeen] = useState<string | null>(getLastSeenVersion);

  const hasUnseen = useMemo(
    () => isNewer(appVersion, lastSeen),
    [lastSeen],
  );

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, appVersion);
    } catch {
      // silently degrade
    }
    setLastSeen(appVersion);
  }, []);

  return { changelog, appVersion, hasUnseen, markSeen };
}
