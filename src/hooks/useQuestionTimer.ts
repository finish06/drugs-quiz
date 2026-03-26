import { useState, useEffect, useCallback, useRef } from "react";

interface UseQuestionTimerOptions {
  /** Total seconds for this question */
  totalSeconds: number;
  /** Called when timer reaches 0 */
  onExpire: () => void;
  /** Whether the timer is active (false = paused/stopped) */
  active: boolean;
}

interface UseQuestionTimerReturn {
  /** Seconds remaining (0 to totalSeconds) */
  secondsLeft: number;
  /** Fraction remaining (0 to 1) for progress bar */
  fraction: number;
  /** Whether the timer has expired */
  expired: boolean;
  /** Reset timer to full duration */
  reset: () => void;
  /** Stop the timer (e.g. when user answers) */
  stop: () => void;
}

export function useQuestionTimer({
  totalSeconds,
  onExpire,
  active,
}: UseQuestionTimerOptions): UseQuestionTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(active);
  const [expired, setExpired] = useState(false);

  // Wall-clock based timing to handle tab visibility correctly
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref in sync
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Initialize start time on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Sync running state with active prop
  useEffect(() => {
    setRunning(active);
  }, [active]);

  const reset = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setExpired(false);
    setRunning(true);
    startTimeRef.current = Date.now();
    pausedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
  }, [totalSeconds]);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  // Handle page visibility (pause on tab switch)
  useEffect(() => {
    function handleVisibility() {
      if (!running) return;

      if (document.hidden) {
        // Pausing — record elapsed time so far
        pausedAtRef.current = Date.now();
      } else if (pausedAtRef.current !== null) {
        // Resuming — adjust start time to exclude paused duration
        const pauseDuration = Date.now() - pausedAtRef.current;
        startTimeRef.current += pauseDuration;
        pausedAtRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running]);

  // Countdown interval
  useEffect(() => {
    if (!running || expired) return;

    const interval = setInterval(() => {
      const now = document.hidden ? (pausedAtRef.current ?? Date.now()) : Date.now();
      const elapsed = elapsedBeforePauseRef.current +
        (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, totalSeconds - elapsed);

      setSecondsLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        setExpired(true);
        setRunning(false);
        onExpireRef.current();
        clearInterval(interval);
      }
    }, 100); // Update frequently for smooth bar animation

    return () => clearInterval(interval);
  }, [running, expired, totalSeconds]);

  const fraction = secondsLeft / totalSeconds;

  return { secondsLeft, fraction, expired, reset, stop };
}
