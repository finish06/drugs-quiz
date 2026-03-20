import { useState, useCallback } from "react";

const STORAGE_KEY = "dq-drug-performance";
const MAX_DRUGS = 200;

export interface DrugPerformance {
  drugName: string;
  displayName: string;
  drugClass: string;
  timesSeen: number;
  timesCorrect: number;
  streak: number;
  lastSeen: string;
}

function loadPerformances(): DrugPerformance[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePerformances(performances: DrugPerformance[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(performances));
  } catch {
    // localStorage full or unavailable — degrade gracefully
  }
}

function computeWeight(perf: DrugPerformance): number {
  const accuracy = perf.timesSeen > 0 ? perf.timesCorrect / perf.timesSeen : 1;
  let weight: number;

  if (accuracy < 0.3) {
    weight = 4.0;
  } else if (accuracy < 0.6) {
    weight = 3.0;
  } else if (accuracy < 0.8) {
    weight = 1.5;
  } else {
    weight = 1.0;
  }

  // Decay: consecutive correct streak reduces weight toward 1.0
  weight = Math.max(1.0, weight - perf.streak * 0.5);
  return weight;
}

export interface UseDrugPerformanceReturn {
  performances: DrugPerformance[];
  recordResult: (drugName: string, displayName: string, drugClass: string, correct: boolean) => void;
  getWeightMap: () => Map<string, number>;
  getWeakDrugs: () => DrugPerformance[];
}

export function useDrugPerformance(): UseDrugPerformanceReturn {
  const [performances, setPerformances] = useState<DrugPerformance[]>(loadPerformances);

  const recordResult = useCallback(
    (drugName: string, displayName: string, drugClass: string, correct: boolean) => {
      setPerformances((prev) => {
        const existing = prev.find((p) => p.drugName === drugName);

        let updated: DrugPerformance[];
        if (existing) {
          updated = prev.map((p) =>
            p.drugName === drugName
              ? {
                  ...p,
                  timesSeen: p.timesSeen + 1,
                  timesCorrect: p.timesCorrect + (correct ? 1 : 0),
                  streak: correct ? p.streak + 1 : 0,
                  lastSeen: new Date().toISOString(),
                }
              : p,
          );
        } else {
          const newEntry: DrugPerformance = {
            drugName,
            displayName,
            drugClass,
            timesSeen: 1,
            timesCorrect: correct ? 1 : 0,
            streak: correct ? 1 : 0,
            lastSeen: new Date().toISOString(),
          };

          updated = [...prev, newEntry];

          // Evict if over limit
          if (updated.length > MAX_DRUGS) {
            // Sort by lastSeen ascending, pick the one with fewest views among oldest 20%
            const sorted = [...updated].sort(
              (a, b) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime(),
            );
            const oldestSlice = sorted.slice(0, Math.ceil(updated.length * 0.2));
            const leastSeen = oldestSlice.reduce((min, p) =>
              p.timesSeen < min.timesSeen ? p : min,
            );
            updated = updated.filter((p) => p.drugName !== leastSeen.drugName);
          }
        }

        savePerformances(updated);
        return updated;
      });
    },
    [],
  );

  const getWeightMap = useCallback((): Map<string, number> => {
    const map = new Map<string, number>();
    for (const perf of performances) {
      map.set(perf.drugName, computeWeight(perf));
    }
    return map;
  }, [performances]);

  const getWeakDrugs = useCallback((): DrugPerformance[] => {
    return performances.filter((p) => p.timesSeen > 0 && p.timesCorrect / p.timesSeen < 0.6);
  }, [performances]);

  return {
    performances,
    recordResult,
    getWeightMap,
    getWeakDrugs,
  };
}
