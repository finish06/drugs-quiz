import { useState, useCallback, useMemo } from "react";
import type { SessionRecord, SessionQuizType } from "@/types/quiz";

const HISTORY_KEY = "dq-session-history";
const COLLAPSED_KEY = "dq-history-collapsed";
const MAX_SESSIONS = 10;

function readSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: SessionRecord[]): void {
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
}

export function useSessionHistory(): UseSessionHistoryReturn {
  const [sessions, setSessions] = useState<SessionRecord[]>(readSessions);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(readCollapsed);

  const saveSession = useCallback((record: SessionRecord) => {
    if (record.questionCount === 0) return;

    setSessions((prev) => {
      const updated = [record, ...prev].slice(0, MAX_SESSIONS);
      writeSessions(updated);
      return updated;
    });
  }, []);

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

  const personalBest = useMemo(() => computePersonalBest(sessions), [sessions]);

  return { sessions, personalBest, isCollapsed, saveSession, toggleCollapsed };
}
