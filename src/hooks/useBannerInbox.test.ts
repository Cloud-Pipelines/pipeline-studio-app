import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { installSource } from "@/config/bannerTestSource";

import { resetBannerStateForTests, useBannerInbox } from "./useBannerInbox";

const DISMISSED_KEY = "dismissed-banners";
const HIDDEN_KEY = "hidden-banners";

afterEach(() => {
  localStorage.clear();
  delete window.__TANGLE_BANNER_SOURCE__;
  resetBannerStateForTests();
});

describe("useBannerInbox", () => {
  it("persists a dismissal the host allows", () => {
    installSource([
      { id: "optional", title: "Optional", body: "", dismissible: true },
    ]);

    const { result } = renderHook(() => useBannerInbox());
    act(() => result.current.dismiss(result.current.banners[0]!));

    expect(result.current.banners).toEqual([]);
    expect(localStorage.getItem(DISMISSED_KEY)).toContain("optional");
  });

  it("keeps a dismissal to this session when the host says the notice is mandatory", () => {
    installSource([{ id: "mandatory", title: "Mandatory", body: "" }]);

    const { result } = renderHook(() => useBannerInbox());
    act(() => result.current.dismiss(result.current.banners[0]!));

    expect(result.current.banners).toEqual([]);
    expect(localStorage.getItem(DISMISSED_KEY)).toBeNull();
  });

  it("hides a notice from the strip while keeping it in the centre", () => {
    installSource([
      { id: "optional", title: "Optional", body: "", dismissible: true },
      { id: "mandatory", title: "Mandatory", body: "" },
    ]);

    const { result } = renderHook(() => useBannerInbox());
    result.current.banners.forEach((banner) =>
      act(() => result.current.hide(banner)),
    );

    expect(result.current.showing).toEqual([]);
    expect(result.current.banners).toHaveLength(2);
    expect(result.current.hasHiddenBanners).toBe(true);

    const hidden = localStorage.getItem(HIDDEN_KEY) ?? "";
    expect(hidden).toContain("optional");
    expect(hidden).not.toContain("mandatory");
  });

  it("puts every hidden notice back at once", () => {
    installSource([
      { id: "a", title: "A", body: "", dismissible: true },
      { id: "b", title: "B", body: "" },
    ]);

    const { result } = renderHook(() => useBannerInbox());
    act(() => result.current.hide(result.current.banners[0]!));
    act(() => result.current.showStrip());

    expect(result.current.showing).toHaveLength(2);
    expect(result.current.hasHiddenBanners).toBe(false);
  });

  it("picks up a hide performed in another tab", () => {
    installSource([{ id: "a", title: "A", body: "", dismissible: true }]);

    const { result } = renderHook(() => useBannerInbox());
    expect(result.current.showing).toHaveLength(1);

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

    expect(result.current.showing).toEqual([]);
  });
});
