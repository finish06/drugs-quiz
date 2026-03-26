import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFlaggedQuestions, getQuestionKey } from "./useFlaggedQuestions";
import type { MultipleChoiceQuestion, MatchingQuestion } from "@/types/quiz";

const MC_QUESTION: MultipleChoiceQuestion = {
  kind: "multiple-choice",
  drugName: "Simvastatin",
  correctAnswer: "HMG-CoA Reductase Inhibitor",
  options: ["ACE Inhibitor", "Beta Blocker", "HMG-CoA Reductase Inhibitor", "ARB"],
};

const MATCH_QUESTION: MatchingQuestion = {
  kind: "matching",
  leftItems: ["drug-a", "drug-b"],
  rightItems: ["Class A", "Class B"],
  correctPairs: { "drug-a": "Class A", "drug-b": "Class B" },
};

beforeEach(() => {
  localStorage.clear();
});

describe("getQuestionKey", () => {
  it("generates mc key from drug name", () => {
    expect(getQuestionKey(MC_QUESTION)).toBe("mc:simvastatin");
  });

  it("generates match key from sorted left items", () => {
    expect(getQuestionKey(MATCH_QUESTION)).toBe("match:drug-a|drug-b");
  });
});

describe("useFlaggedQuestions", () => {
  it("starts with no flagged questions", () => {
    const { result } = renderHook(() => useFlaggedQuestions());
    expect(result.current.flaggedCount).toBe(0);
  });

  it("flags a question", () => {
    const { result } = renderHook(() => useFlaggedQuestions());
    act(() => result.current.toggleFlag(MC_QUESTION));
    expect(result.current.flaggedCount).toBe(1);
    expect(result.current.isFlagged(MC_QUESTION)).toBe(true);
  });

  it("unflags a question", () => {
    const { result } = renderHook(() => useFlaggedQuestions());
    act(() => result.current.toggleFlag(MC_QUESTION));
    act(() => result.current.toggleFlag(MC_QUESTION));
    expect(result.current.flaggedCount).toBe(0);
    expect(result.current.isFlagged(MC_QUESTION)).toBe(false);
  });

  it("flags both MC and matching questions", () => {
    const { result } = renderHook(() => useFlaggedQuestions());
    act(() => result.current.toggleFlag(MC_QUESTION));
    act(() => result.current.toggleFlag(MATCH_QUESTION));
    expect(result.current.flaggedCount).toBe(2);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFlaggedQuestions());
    act(() => result.current.toggleFlag(MC_QUESTION));

    const stored = JSON.parse(localStorage.getItem("dq-flagged-questions") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].key).toBe("mc:simvastatin");
  });

  it("loads from localStorage on mount", () => {
    localStorage.setItem("dq-flagged-questions", JSON.stringify([
      { key: "mc:simvastatin", question: MC_QUESTION, flaggedAt: "2026-01-01T00:00:00Z" },
    ]));

    const { result } = renderHook(() => useFlaggedQuestions());
    expect(result.current.flaggedCount).toBe(1);
    expect(result.current.isFlagged(MC_QUESTION)).toBe(true);
  });

  it("evicts oldest when exceeding 50 items", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      key: `mc:drug-${i}`,
      question: { ...MC_QUESTION, drugName: `drug-${i}` },
      flaggedAt: new Date(2026, 0, i + 1).toISOString(),
    }));
    localStorage.setItem("dq-flagged-questions", JSON.stringify(items));

    const { result } = renderHook(() => useFlaggedQuestions());
    expect(result.current.flaggedCount).toBe(50);

    const newQuestion = { ...MC_QUESTION, drugName: "new-drug" };
    act(() => result.current.toggleFlag(newQuestion));
    expect(result.current.flaggedCount).toBe(50);
    expect(result.current.isFlagged(newQuestion)).toBe(true);
  });
});
