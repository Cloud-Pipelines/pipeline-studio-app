import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BetaFlag } from "../types";
import { useBetaFlagsReducer } from "../useBetaFlagReducer";

describe("useBetaFlagsReducer", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const mockBetaFlags: Record<string, BetaFlag> = {
    feature1: {
      name: "Feature 1",
      description: "First feature flag",
      default: false,
    },
    feature2: {
      name: "Feature 2",
      description: "Second feature flag",
      default: true,
    },
    feature3: {
      name: "Feature 3",
      description: "Third feature flag",
      default: false,
    },
  };

  it("should initialize state with default values when no flags are stored", () => {
    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [state] = result.current;

    expect(state).toHaveLength(3);
    expect(state[0]).toEqual({
      key: "feature1",
      name: "Feature 1",
      description: "First feature flag",
      enabled: false,
      default: false,
    });
    expect(state[1]).toEqual({
      key: "feature2",
      name: "Feature 2",
      description: "Second feature flag",
      enabled: true, // Should use default value
      default: true,
    });
    expect(state[2]).toEqual({
      key: "feature3",
      name: "Feature 3",
      description: "Third feature flag",
      enabled: false,
      default: false,
    });
  });

  it("should initialize state with stored values when flags exist in localStorage", () => {
    // Pre-populate localStorage
    localStorage.setItem(
      "betaFlags",
      JSON.stringify({
        feature1: true,
        feature2: false,
        feature3: true,
      }),
    );

    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [state] = result.current;

    expect(state).toHaveLength(3);
    expect(state.find((f) => f.key === "feature1")?.enabled).toBe(true);
    expect(state.find((f) => f.key === "feature2")?.enabled).toBe(false);
    expect(state.find((f) => f.key === "feature3")?.enabled).toBe(true);
  });

  it("should handle setFlag action correctly", () => {
    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [initialState, dispatch] = result.current;

    expect(initialState.find((f: any) => f.key === "feature1")?.enabled).toBe(
      false,
    );

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature1",
          enabled: true,
        },
      });
    });

    const [newState] = result.current;
    expect(newState.find((f: any) => f.key === "feature1")?.enabled).toBe(true);
    expect(newState.find((f: any) => f.key === "feature2")?.enabled).toBe(true); // Should remain default
    expect(newState.find((f: any) => f.key === "feature3")?.enabled).toBe(
      false,
    );
  });

  it("should persist flag changes to localStorage", () => {
    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [, dispatch] = result.current;

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature1",
          enabled: true,
        },
      });
    });

    const storedFlags = JSON.parse(localStorage.getItem("betaFlags") || "{}");
    expect(storedFlags.feature1).toBe(true);
  });

  it("should handle multiple flag updates correctly", () => {
    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [, dispatch] = result.current;

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature1",
          enabled: true,
        },
      });
    });

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature3",
          enabled: true,
        },
      });
    });

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature2",
          enabled: false,
        },
      });
    });

    const [state] = result.current;
    expect(state.find((f: any) => f.key === "feature1")?.enabled).toBe(true);
    expect(state.find((f: any) => f.key === "feature2")?.enabled).toBe(false);
    expect(state.find((f: any) => f.key === "feature3")?.enabled).toBe(true);

    const storedFlags = JSON.parse(localStorage.getItem("betaFlags") || "{}");
    expect(storedFlags).toEqual({
      feature1: true,
      feature2: false,
      feature3: true,
    });
  });

  it("should clean up non-existing flags from localStorage", () => {
    // Pre-populate localStorage with extra flags
    localStorage.setItem(
      "betaFlags",
      JSON.stringify({
        feature1: true,
        feature2: false,
        obsoleteFlag: true,
        anotherObsoleteFlag: false,
      }),
    );

    renderHook(() => useBetaFlagsReducer(mockBetaFlags));

    // Check that obsolete flags are removed
    const storedFlags = JSON.parse(localStorage.getItem("betaFlags") || "{}");
    expect(storedFlags).toEqual({
      feature1: true,
      feature2: false,
    });
    expect(storedFlags.obsoleteFlag).toBeUndefined();
    expect(storedFlags.anotherObsoleteFlag).toBeUndefined();
  });

  it("should handle empty betaFlags object", () => {
    const { result } = renderHook(() => useBetaFlagsReducer({}));
    const [state] = result.current;

    expect(state).toHaveLength(0);
  });

  it("should preserve unchanged flags when one flag is updated", () => {
    // Pre-populate localStorage
    localStorage.setItem(
      "betaFlags",
      JSON.stringify({
        feature1: true,
        feature2: false,
        feature3: true,
      }),
    );

    const { result } = renderHook(() => useBetaFlagsReducer(mockBetaFlags));
    const [, dispatch] = result.current;

    act(() => {
      dispatch({
        type: "setFlag",
        payload: {
          key: "feature2",
          enabled: true,
        },
      });
    });

    const [state] = result.current;
    // Other flags should remain unchanged
    expect(state.find((f: any) => f.key === "feature1")?.enabled).toBe(true);
    expect(state.find((f: any) => f.key === "feature2")?.enabled).toBe(true);
    expect(state.find((f: any) => f.key === "feature3")?.enabled).toBe(true);
  });
});
