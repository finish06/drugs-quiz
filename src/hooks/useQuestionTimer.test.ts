import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuestionTimer } from "./useQuestionTimer";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useQuestionTimer", () => {
  it("starts with full time remaining", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 30, onExpire, active: true }),
    );
    expect(result.current.secondsLeft).toBe(30);
    expect(result.current.fraction).toBe(1);
    expect(result.current.expired).toBe(false);
  });

  it("counts down when active", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 10, onExpire, active: true }),
    );

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBeLessThanOrEqual(6);
    expect(result.current.expired).toBe(false);
  });

  it("does not count when inactive", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 10, onExpire, active: false }),
    );

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBe(10);
  });

  it("calls onExpire when time runs out", () => {
    const onExpire = vi.fn();
    renderHook(() =>
      useQuestionTimer({ totalSeconds: 2, onExpire, active: true }),
    );

    act(() => { vi.advanceTimersByTime(3000); });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("sets expired to true when timer finishes", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 1, onExpire, active: true }),
    );

    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current.expired).toBe(true);
    expect(result.current.secondsLeft).toBe(0);
  });

  it("stops counting when stop() is called", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 10, onExpire, active: true }),
    );

    act(() => { vi.advanceTimersByTime(3000); });
    const secondsAtStop = result.current.secondsLeft;

    act(() => { result.current.stop(); });
    act(() => { vi.advanceTimersByTime(5000); });

    expect(result.current.secondsLeft).toBe(secondsAtStop);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("resets timer to full duration", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useQuestionTimer({ totalSeconds: 10, onExpire, active: true }),
    );

    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { result.current.reset(); });

    expect(result.current.secondsLeft).toBe(10);
    expect(result.current.expired).toBe(false);
  });
});
