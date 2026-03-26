import { useState, useCallback, useEffect } from "react";
import type { Question } from "@/types/quiz";

export interface FlaggedQuestion {
  key: string;
  question: Question;
  flaggedAt: string;
}

const STORAGE_KEY = "dq-flagged-questions";
const MAX_FLAGGED = 50;

function getQuestionKey(question: Question): string {
  if (question.kind === "multiple-choice") {
    return `mc:${question.drugName.toLowerCase()}`;
  }
  // Matching: deterministic key from sorted left items
  return `match:${[...question.leftItems].sort().join("|").toLowerCase()}`;
}

function loadFlagged(): FlaggedQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFlagged(items: FlaggedQuestion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

export function useFlaggedQuestions() {
  const [flagged, setFlagged] = useState<FlaggedQuestion[]>(() => loadFlagged());

  // Sync to localStorage on change
  useEffect(() => {
    saveFlagged(flagged);
  }, [flagged]);

  const isFlagged = useCallback(
    (question: Question): boolean => {
      const key = getQuestionKey(question);
      return flagged.some((f) => f.key === key);
    },
    [flagged],
  );

  const toggleFlag = useCallback(
    (question: Question) => {
      const key = getQuestionKey(question);
      setFlagged((prev) => {
        const existing = prev.findIndex((f) => f.key === key);
        if (existing >= 0) {
          // Unflag
          return prev.filter((_, i) => i !== existing);
        }
        // Flag — enforce max limit with FIFO eviction
        const entry: FlaggedQuestion = {
          key,
          question,
          flaggedAt: new Date().toISOString(),
        };
        const next = [...prev, entry];
        if (next.length > MAX_FLAGGED) {
          // Evict oldest by flaggedAt
          next.sort((a, b) => a.flaggedAt.localeCompare(b.flaggedAt));
          return next.slice(next.length - MAX_FLAGGED);
        }
        return next;
      });
    },
    [],
  );

  const flaggedCount = flagged.length;
  const flaggedQuestions = flagged.map((f) => f.question);

  return { flagged, flaggedCount, flaggedQuestions, isFlagged, toggleFlag };
}

export { getQuestionKey };
