import { afterEach, describe, expect, it, vi } from "vitest";

import { installRawSource } from "@/config/bannerTestSource";

import {
  getBannersSnapshot,
  refreshBanners,
  resetBannerCacheForTests,
  subscribeToBanners,
} from "./banners";

function staticSource(getSnapshot: () => unknown, refresh?: () => void) {
  return {
    version: 1,
    getSnapshot,
    subscribe: () => () => {},
    ...(refresh ? { refresh } : {}),
  };
}

describe("banners", () => {
  afterEach(() => {
    delete window.__TANGLE_BANNER_SOURCE__;
    resetBannerCacheForTests();
  });

  describe("getBannersSnapshot", () => {
    it("is empty and reference-stable with no source installed", () => {
      expect(getBannersSnapshot()).toEqual([]);
      expect(getBannersSnapshot()).toBe(getBannersSnapshot());
    });

    it("ignores a source declaring an unsupported major version", () => {
      installRawSource({
        version: 2,
        getSnapshot: () => [{ id: "a", title: "Later contract", body: "" }],
        subscribe: () => () => {},
      });

      expect(getBannersSnapshot()).toEqual([]);
    });

    it("ignores a malformed source", () => {
      installRawSource({
        version: 1,
        getSnapshot: [],
        subscribe: () => () => {},
      });
      expect(getBannersSnapshot()).toEqual([]);

      installRawSource({ version: 1, getSnapshot: () => [] });
      expect(getBannersSnapshot()).toEqual([]);

      installRawSource("not a source");
      expect(getBannersSnapshot()).toEqual([]);
    });

    it("survives a source whose getSnapshot throws", () => {
      installRawSource(
        staticSource(() => {
          throw new Error("host is broken");
        }),
      );

      expect(getBannersSnapshot()).toEqual([]);
    });

    it("returns the same reference until the content changes", () => {
      let published: unknown = [{ id: "a", title: "First", body: "" }];
      installRawSource(staticSource(() => published));

      const first = getBannersSnapshot();
      expect(first).toBe(getBannersSnapshot());
      expect(first).toHaveLength(1);

      published = [{ id: "b", title: "Second", body: "" }];
      const second = getBannersSnapshot();

      expect(second).not.toBe(first);
      expect(second[0]?.id).toBe("b");
    });

    it("returns the same reference to a host that rebuilds its array per read", () => {
      const banners = [{ id: "a", title: "First", body: "" }];
      installRawSource(
        staticSource(() => banners.map((banner) => ({ ...banner }))),
      );

      const first = getBannersSnapshot();

      expect(first).toBe(getBannersSnapshot());
      expect(first).toHaveLength(1);
    });

    it("ignores a non-array snapshot", () => {
      installRawSource(staticSource(() => ({ banners: [] })));
      expect(getBannersSnapshot()).toEqual([]);
    });

    it("coerces an unrecognised variant to info", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "Notice", body: "", variant: "catastrophe" },
        ]),
      );

      expect(getBannersSnapshot()[0]?.variant).toBe("info");
    });

    it("keeps the four known variants", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "A", body: "", variant: "info" },
          { id: "b", title: "B", body: "", variant: "warning" },
          { id: "c", title: "C", body: "", variant: "success" },
          { id: "d", title: "D", body: "", variant: "error" },
        ]),
      );

      expect(getBannersSnapshot().map((banner) => banner.variant)).toEqual([
        "info",
        "warning",
        "success",
        "error",
      ]);
    });

    it("drops entries without a usable id", () => {
      installRawSource(
        staticSource(() => [
          { title: "No id", body: "" },
          { id: "   ", title: "Blank id", body: "" },
          { id: {}, title: "Object id", body: "" },
          { id: "kept", title: "Kept", body: "" },
        ]),
      );

      expect(getBannersSnapshot().map((banner) => banner.id)).toEqual(["kept"]);
    });

    it("drops entries with neither a title nor a non-blank body", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "   ", body: "  \n " },
          { id: "b", title: "Title only", body: "" },
          { id: "c", title: "", body: "Body only" },
        ]),
      );

      expect(getBannersSnapshot().map((banner) => banner.id)).toEqual([
        "b",
        "c",
      ]);
    });

    it("drops an action whose url is not absolute http(s)", () => {
      installRawSource(
        staticSource(() => [
          {
            id: "a",
            title: "Script url",
            body: "",
            action: { url: "javascript:alert(1)", text: "Run" },
          },
          {
            id: "b",
            title: "Relative url",
            body: "",
            action: { url: "/internal/page", text: "Open" },
          },
          {
            id: "c",
            title: "Absolute url",
            body: "",
            action: { url: "https://example.com/notes", text: "Read" },
          },
        ]),
      );

      const [scriptUrl, relativeUrl, absoluteUrl] = getBannersSnapshot();

      expect(scriptUrl?.action).toBeUndefined();
      expect(relativeUrl?.action).toBeUndefined();
      expect(absoluteUrl?.action).toEqual({
        url: "https://example.com/notes",
        text: "Read",
      });
    });

    it("falls back to default action text when the host omits it", () => {
      installRawSource(
        staticSource(() => [
          {
            id: "a",
            title: "Notice",
            body: "",
            action: { url: "https://example.com" },
          },
        ]),
      );

      expect(getBannersSnapshot()[0]?.action?.text).toBe("Learn more");
    });

    it("only marks a banner dismissible when the host says so explicitly", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "A", body: "", dismissible: true },
          { id: "b", title: "B", body: "", dismissible: "yes" },
          { id: "c", title: "C", body: "" },
        ]),
      );

      expect(getBannersSnapshot().map((banner) => banner.dismissible)).toEqual([
        true,
        undefined,
        undefined,
      ]);
    });

    it("coerces a numeric id to a string", () => {
      installRawSource(
        staticSource(() => [{ id: 7, title: "Numeric id", body: "" }]),
      );

      expect(getBannersSnapshot()[0]?.id).toBe("7");
    });

    it("keeps the first of two entries sharing an id", () => {
      installRawSource(
        staticSource(() => [
          { id: "dup", title: "First wins", body: "" },
          { id: "dup", title: "Second is dropped", body: "" },
        ]),
      );

      expect(getBannersSnapshot().map((banner) => banner.title)).toEqual([
        "First wins",
      ]);
    });

    it("caps how many entries a host can publish", () => {
      installRawSource(
        staticSource(() =>
          Array.from({ length: 500 }, (_, index) => ({
            id: `banner-${index}`,
            title: `Notice ${index}`,
            body: "",
          })),
        ),
      );

      expect(getBannersSnapshot()).toHaveLength(20);
    });

    it("freezes each banner, not just the array", () => {
      installRawSource(
        staticSource(() => [{ id: "a", title: "Original", body: "" }]),
      );

      const snapshot = getBannersSnapshot();
      const banner = snapshot[0];

      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(banner)).toBe(true);
      expect(() => {
        banner.title = "Mutated";
      }).toThrow();
      expect(getBannersSnapshot()[0]?.title).toBe("Original");
    });

    it("preserves body whitespace, which is meaningful in Markdown", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "Notice", body: "  - indented list item" },
        ]),
      );

      expect(getBannersSnapshot()[0]?.body).toBe("  - indented list item");
    });
  });

  describe("subscribeToBanners", () => {
    it("forwards host notifications and unsubscribes cleanly", () => {
      const hostListeners = new Set<() => void>();
      installRawSource({
        version: 1,
        getSnapshot: () => [],
        subscribe: (listener: () => void) => {
          hostListeners.add(listener);
          return () => hostListeners.delete(listener);
        },
      });

      const listener = vi.fn();
      const unsubscribe = subscribeToBanners(listener);

      hostListeners.forEach((hostListener) => hostListener());
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(hostListeners.size).toBe(0);
    });

    it("binds to a source installed after the subscription", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToBanners(listener);

      expect(listener).not.toHaveBeenCalled();

      installRawSource(staticSource(() => []));

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });

    it("tolerates a source that does not return an unsubscribe function", () => {
      installRawSource({
        version: 1,
        getSnapshot: () => [],
        subscribe: () => undefined,
      });

      const unsubscribe = subscribeToBanners(vi.fn());
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("refreshBanners", () => {
    it("asks the host to re-fetch when it supports it", () => {
      const refresh = vi.fn();
      installRawSource(staticSource(() => [], refresh));

      refreshBanners();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when refresh is absent or throws", () => {
      installRawSource(staticSource(() => []));
      expect(() => refreshBanners()).not.toThrow();

      installRawSource(
        staticSource(
          () => [],
          () => {
            throw new Error("host is broken");
          },
        ),
      );
      expect(() => refreshBanners()).not.toThrow();
    });
  });
});
