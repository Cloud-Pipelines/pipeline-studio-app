import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { installSource } from "@/config/noticeTestSource";

import { resetNoticeStateForTests, useNoticeInbox } from "./useNoticeInbox";

const DISMISSED_KEY = "dismissed-notices";

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

  it("picks up a dismissal performed in another tab", () => {
    installSource([{ id: "a", title: "A", body: "", dismissible: true }]);

    const { result } = renderHook(() => useNoticeInbox());
    expect(result.current.notices).toHaveLength(1);

    act(() => {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(["a"]));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: DISMISSED_KEY,
          newValue: JSON.stringify(["a"]),
          storageArea: localStorage,
        }),
      );
    });

    expect(result.current.notices).toEqual([]);
  });
});
