import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { TangleNotice } from "@/config/notices";

import {
  resetHiddenNoticesForTests,
  useHiddenNotices,
} from "./useHiddenNotices";

const HIDDEN_KEY = "hidden-notices";

const notice = (id: string, dismissible?: true): TangleNotice => ({
  id,
  title: id,
  body: "",
  variant: "info",
  ...(dismissible ? { dismissible } : {}),
});

afterEach(() => {
  localStorage.clear();
  resetHiddenNoticesForTests();
});

describe("useHiddenNotices", () => {
  it("hides nothing until asked", () => {
    const { result } = renderHook(() => useHiddenNotices());

    expect(result.current.hiddenIds.size).toBe(0);
  });

  it("remembers a hidden notice only as long as the host allows", () => {
    const { result } = renderHook(() => useHiddenNotices());

    act(() => result.current.hide(notice("persisted", true)));
    act(() => result.current.hide(notice("session-only")));

    expect([...result.current.hiddenIds]).toEqual([
      "persisted",
      "session-only",
    ]);

    const stored = localStorage.getItem(HIDDEN_KEY) ?? "";
    expect(stored).toContain("persisted");
    expect(stored).not.toContain("session-only");
  });

  it("hides every notice in one go", () => {
    const { result } = renderHook(() => useHiddenNotices());

    act(() => result.current.hideAll([notice("a", true), notice("b")]));

    expect(result.current.hiddenIds.size).toBe(2);
  });

  it("puts every hidden notice back at once", () => {
    const { result } = renderHook(() => useHiddenNotices());

    act(() => result.current.hideAll([notice("a", true), notice("b")]));
    act(() => result.current.showAll());

    expect(result.current.hiddenIds.size).toBe(0);
    expect(localStorage.getItem(HIDDEN_KEY)).toBe("[]");
  });

  it("picks up a hide performed in another tab", () => {
    const { result } = renderHook(() => useHiddenNotices());

    act(() => {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(["a"]));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: HIDDEN_KEY,
          newValue: JSON.stringify(["a"]),
          storageArea: localStorage,
        }),
      );
    });

    expect(result.current.hiddenIds.has("a")).toBe(true);
  });
});
