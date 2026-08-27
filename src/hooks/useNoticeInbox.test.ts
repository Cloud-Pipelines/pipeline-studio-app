import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { installSource } from "@/config/noticeTestSource";

import { resetNoticeStateForTests, useNoticeInbox } from "./useNoticeInbox";

const DISMISSED_KEY = "dismissed-notices";
const HIDDEN_KEY = "hidden-notices";

afterEach(() => {
  localStorage.clear();
  delete window.__TANGLE_NOTICE_SOURCE__;
  resetNoticeStateForTests();
});

describe("useNoticeInbox", () => {
  it("persists a dismissal the host allows", () => {
    installSource([
      { id: "optional", title: "Optional", body: "", dismissible: true },
    ]);

    const { result } = renderHook(() => useNoticeInbox());
    act(() => result.current.dismiss(result.current.notices[0]!));

    expect(result.current.notices).toEqual([]);
    expect(localStorage.getItem(DISMISSED_KEY)).toContain("optional");
  });

  it("keeps a dismissal to this session when the host says the notice is mandatory", () => {
    installSource([{ id: "mandatory", title: "Mandatory", body: "" }]);

    const { result } = renderHook(() => useNoticeInbox());
    act(() => result.current.dismiss(result.current.notices[0]!));

    expect(result.current.notices).toEqual([]);
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it("hides a notice from the banners while keeping it in the centre", () => {
    installSource([
      { id: "optional", title: "Optional", body: "", dismissible: true },
      { id: "mandatory", title: "Mandatory", body: "" },
    ]);

    const { result } = renderHook(() => useNoticeInbox());
    result.current.notices.forEach((notice) =>
      act(() => result.current.hide(notice)),
    );

    expect(result.current.banners).toEqual([]);
    expect(result.current.notices).toHaveLength(2);
    expect(result.current.hasHiddenNotices).toBe(true);

    const hidden = localStorage.getItem(HIDDEN_KEY) ?? "";
    expect(hidden).toContain("optional");
    expect(hidden).not.toContain("mandatory");
  });

  it("puts every hidden notice back at once", () => {
    installSource([
      { id: "a", title: "A", body: "", dismissible: true },
      { id: "b", title: "B", body: "" },
    ]);

    const { result } = renderHook(() => useNoticeInbox());
    act(() => result.current.hide(result.current.notices[0]!));
    act(() => result.current.showBanners());

    expect(result.current.banners).toHaveLength(2);
    expect(result.current.hasHiddenNotices).toBe(false);
  });

  it("picks up a hide performed in another tab", () => {
    installSource([{ id: "a", title: "A", body: "", dismissible: true }]);

    const { result } = renderHook(() => useNoticeInbox());
    expect(result.current.banners).toHaveLength(1);

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

    expect(result.current.banners).toEqual([]);
  });
});
