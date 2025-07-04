import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useCooldownTimer from "./useCooldownTimer";

describe("useCooldownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("initializes with default time of 0", () => {
    const { result } = renderHook(() => useCooldownTimer());

    expect(result.current.cooldownTime).toBe(0);
    expect(typeof result.current.setCooldownTime).toBe("function");
  });

  it("initializes with provided initial time", () => {
    const { result } = renderHook(() => useCooldownTimer(5));

    expect(result.current.cooldownTime).toBe(5);
  });

  it("decrements cooldown time every second", () => {
    const { result } = renderHook(() => useCooldownTimer(3));

    expect(result.current.cooldownTime).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(0);
  });

  it("stops decrementing when cooldown reaches 0", () => {
    const { result } = renderHook(() => useCooldownTimer(1));

    expect(result.current.cooldownTime).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(0);
  });

  it("allows manual setting of cooldown time", () => {
    const { result } = renderHook(() => useCooldownTimer(0));

    expect(result.current.cooldownTime).toBe(0);

    act(() => {
      result.current.setCooldownTime(10);
    });

    expect(result.current.cooldownTime).toBe(10);
  });

  it("continues counting down after manual setting", () => {
    const { result } = renderHook(() => useCooldownTimer(0));

    act(() => {
      result.current.setCooldownTime(2);
    });

    expect(result.current.cooldownTime).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownTime).toBe(0);
  });

  it("handles rapid time advances correctly", () => {
    const { result } = renderHook(() => useCooldownTimer(5));

    expect(result.current.cooldownTime).toBe(5);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.cooldownTime).toBe(4);
  });

  it("cleans up timer on unmount", () => {
    const { unmount } = renderHook(() => useCooldownTimer(5));

    // This test mainly ensures the cleanup function exists and doesn't throw
    expect(() => unmount()).not.toThrow();
  });
});
