import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "@/utils/string";

import { useCopyToClipboard } from "./useCopyToClip";

// Mock the copyToClipboard utility
vi.mock("@/utils/string", () => ({
  copyToClipboard: vi.fn(),
}));

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useCopyToClipboard("test text"));

    expect(result.current.isCopied).toBe(false);
    expect(result.current.isTooltipOpen).toBe(false);
    expect(typeof result.current.handleCopy).toBe("function");
    expect(typeof result.current.handleTooltipOpen).toBe("function");
  });

  it("handles copy when text is provided", () => {
    const { result } = renderHook(() => useCopyToClipboard("test text"));

    act(() => {
      result.current.handleCopy();
    });

    expect(copyToClipboard).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(true);
    expect(result.current.isTooltipOpen).toBe(true);
  });

  it("does not copy when text is null", () => {
    const { result } = renderHook(() => useCopyToClipboard(null));

    act(() => {
      result.current.handleCopy();
    });

    expect(copyToClipboard).not.toHaveBeenCalled();
    expect(result.current.isCopied).toBe(false);
  });

  it("does not copy when text is undefined", () => {
    const { result } = renderHook(() => useCopyToClipboard(undefined));

    act(() => {
      result.current.handleCopy();
    });

    expect(copyToClipboard).not.toHaveBeenCalled();
    expect(result.current.isCopied).toBe(false);
  });

  it("handles tooltip open/close", () => {
    const { result } = renderHook(() => useCopyToClipboard("test text"));

    act(() => {
      result.current.handleTooltipOpen(true);
    });

    expect(result.current.isTooltipOpen).toBe(true);

    act(() => {
      result.current.handleTooltipOpen(false);
    });

    expect(result.current.isTooltipOpen).toBe(false);
    expect(result.current.isCopied).toBe(false);
  });

  it("auto-closes tooltip after 1.5 seconds", () => {
    const { result } = renderHook(() => useCopyToClipboard("test text"));

    act(() => {
      result.current.handleCopy();
    });

    expect(result.current.isTooltipOpen).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isTooltipOpen).toBe(false);
  });

  it("clears timeout when tooltip is manually closed", () => {
    const { result } = renderHook(() => useCopyToClipboard("test text"));

    act(() => {
      result.current.handleCopy();
    });

    act(() => {
      result.current.handleTooltipOpen(false);
    });

    expect(result.current.isTooltipOpen).toBe(false);

    // Advance time to ensure the timeout doesn't fire
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isTooltipOpen).toBe(false);
  });

  it("cleans up timeout on unmount", () => {
    const { unmount } = renderHook(() => useCopyToClipboard("test text"));

    // This test mainly ensures the cleanup function exists and doesn't throw
    expect(() => unmount()).not.toThrow();
  });
});
