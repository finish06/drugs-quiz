import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useDrugPerformance } from "./useDrugPerformance";

beforeEach(() => {
  localStorage.clear();
});

describe("AC-001: Save drug performance to localStorage", () => {
  it("should save drug performance after recording results", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
    });

    expect(result.current.performances).toHaveLength(1);
    expect(result.current.performances[0]!.drugName).toBe("simvastatin");
    expect(result.current.performances[0]!.timesSeen).toBe(1);
    expect(result.current.performances[0]!.timesCorrect).toBe(1);
  });

  it("should persist to localStorage", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
    });

    const stored = JSON.parse(localStorage.getItem("dq-drug-performance") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].drugName).toBe("simvastatin");
  });
});

describe("AC-002: Shared across quiz types", () => {
  it("should update same drug record regardless of quiz context", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
    });

    expect(result.current.performances).toHaveLength(1);
    expect(result.current.performances[0]!.timesSeen).toBe(2);
    expect(result.current.performances[0]!.timesCorrect).toBe(1);
  });
});

describe("AC-003: Weight map for biased selection", () => {
  it("should return weight > 1 for weak drugs", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      // Get wrong 3 times
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
    });

    const weights = result.current.getWeightMap();
    expect(weights.get("simvastatin")).toBeGreaterThan(1);
  });

  it("should return weight 1.0 for strong drugs", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
    });

    const weights = result.current.getWeightMap();
    expect(weights.get("simvastatin")).toBe(1);
  });
});

describe("AC-004: Decay on consecutive correct answers", () => {
  it("should track consecutive correct streak", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      // Wrong first, then correct streak
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
    });

    expect(result.current.performances[0]!.streak).toBe(2);
  });

  it("should reset streak on incorrect answer", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
    });

    expect(result.current.performances[0]!.streak).toBe(0);
  });
});

describe("AC-005: Maximum 200 drugs with eviction", () => {
  it("should evict oldest drug when adding 201st", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      // Add 200 drugs
      for (let i = 0; i < 200; i++) {
        result.current.recordResult(`drug-${i}`, `Drug ${i}`, `Class ${i}`, true);
      }
    });

    expect(result.current.performances).toHaveLength(200);

    act(() => {
      result.current.recordResult("drug-200", "Drug 200", "Class 200", true);
    });

    expect(result.current.performances).toHaveLength(200);
    // The new drug should be present
    expect(result.current.performances.some(p => p.drugName === "drug-200")).toBe(true);
  });
});

describe("AC-006: Study Weak Drugs availability", () => {
  it("should return weak drugs with accuracy < 60%", () => {
    const { result } = renderHook(() => useDrugPerformance());

    act(() => {
      // Drug with 33% accuracy (1/3 correct)
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", true);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
      result.current.recordResult("simvastatin", "Simvastatin", "HMG-CoA Reductase Inhibitor", false);
      // Drug with 100% accuracy
      result.current.recordResult("lisinopril", "Lisinopril", "ACE Inhibitor", true);
    });

    const weakDrugs = result.current.getWeakDrugs();
    expect(weakDrugs).toHaveLength(1);
    expect(weakDrugs[0]!.drugName).toBe("simvastatin");
  });
});

describe("AC-010: No data behaves normally", () => {
  it("should return empty weight map when no data", () => {
    const { result } = renderHook(() => useDrugPerformance());

    const weights = result.current.getWeightMap();
    expect(weights.size).toBe(0);
  });
});

describe("AC-011: Graceful degradation", () => {
  it("should handle corrupted localStorage gracefully", () => {
    localStorage.setItem("dq-drug-performance", "not-valid-json");
    const { result } = renderHook(() => useDrugPerformance());
    expect(result.current.performances).toHaveLength(0);
  });
});

describe("AC-011: Survives page reload", () => {
  it("should restore performances from localStorage on mount", () => {
    localStorage.setItem("dq-drug-performance", JSON.stringify([{
      drugName: "simvastatin",
      displayName: "Simvastatin",
      drugClass: "HMG-CoA Reductase Inhibitor",
      timesSeen: 3,
      timesCorrect: 1,
      streak: 0,
      lastSeen: new Date().toISOString(),
    }]));

    const { result } = renderHook(() => useDrugPerformance());
    expect(result.current.performances).toHaveLength(1);
    expect(result.current.performances[0]!.drugName).toBe("simvastatin");
  });
});
