import { useState, useCallback } from "react";

const SEEN_KEY = "dq-kbd-hints-seen";

function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export interface UseKeyboardHintsSeenReturn {
  hasSeen: boolean;
  markSeen: () => void;
}

export function useKeyboardHintsSeen(): UseKeyboardHintsSeenReturn {
  const [hasSeen, setHasSeen] = useState<boolean>(readSeen);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // silently degrade
    }
    setHasSeen(true);
  }, []);

  return { hasSeen, markSeen };
}
