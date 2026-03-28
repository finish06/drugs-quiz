import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { SessionRecord, SessionQuizType } from "@/types/quiz";

const HISTORY_KEY = "dq-session-history";
const COLLAPSED_KEY = "dq-history-collapsed";
const MAX_SESSIONS = 10;

function readLocalSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: SessionRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage full or unavailable — silently degrade
  }
}

function readCollapsed(): boolean {
  return localStorage.getItem(COLLAPSED_KEY) === "true";
}

function computePersonalBest(sessions: SessionRecord[]): Partial<Record<SessionQuizType, number>> {
  const best: Partial<Record<SessionQuizType, number>> = {};
  for (const s of sessions) {
    const current = best[s.quizType];
    if (current === undefined || s.percentage > current) {
      best[s.quizType] = s.percentage;
    }
  }
  return best;
}

export interface UseSessionHistoryReturn {
  sessions: SessionRecord[];
  personalBest: Partial<Record<SessionQuizType, number>>;
  isCollapsed: boolean;
  saveSession: (record: SessionRecord) => void;
  toggleCollapsed: () => void;
  /** Whether localStorage has session data (for migration prompt) */
  hasLocalSessions: boolean;
  /** Number of sessions in localStorage */
  localSessionCount: number;
  /** Clear localStorage session data after successful migration */
  clearLocalSessions: () => void;
  /** Server-side session ID from the most recent save (for share link) */
  lastSavedSessionId: string | null;
}

export function useSessionHistory(): UseSessionHistoryReturn {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>(() =>
    isAuthenticated ? [] : readLocalSessions(),
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(readCollapsed);
  const [localSessions] = useState<SessionRecord[]>(readLocalSessions);
  const [lastSavedSessionId, setLastSavedSessionId] = useState<string | null>(null);

  // Fetch sessions from API when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function fetchSessions() {
      try {
        const res = await fetch(`/api/sessions?limit=${MAX_SESSIONS}`, {
          credentials: "include",
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSessions(data.sessions ?? []);
        }
      } catch {
        // Fall back to localStorage on network error
        if (!cancelled) {
          setSessions(readLocalSessions());
        }
      }
    }

    fetchSessions();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const saveSession = useCallback(
    (record: SessionRecord) => {
      if (record.questionCount === 0) return;

      setSessions((prev) => {
        const updated = [record, ...prev].slice(0, MAX_SESSIONS);
        if (!isAuthenticated) {
          writeLocalSessions(updated);
        }
        return updated;
      });

      // Also save to API if authenticated
      if (isAuthenticated) {
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            quizType: record.quizType,
            questionCount: record.questionCount,
            correctCount: record.correctCount,
            percentage: record.percentage,
            completedAt: record.completedAt,
            answersJson: [],
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.id) setLastSavedSessionId(data.id);
          })
          .catch(() => {
            // Best effort — session is already in local state
          });
      }
    },
    [isAuthenticated],
  );

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        // silently degrade
      }
      return next;
    });
  }, []);

  const clearLocalSessions = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // silently degrade
    }
  }, []);

  const personalBest = useMemo(() => computePersonalBest(sessions), [sessions]);

  return {
    sessions,
    personalBest,
    isCollapsed,
    saveSession,
    toggleCollapsed,
    hasLocalSessions: localSessions.length > 0,
    localSessionCount: localSessions.length,
    clearLocalSessions,
    lastSavedSessionId,
  };
}
