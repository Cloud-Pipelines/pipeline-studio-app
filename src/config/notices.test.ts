import { afterEach, describe, expect, it, vi } from "vitest";

import { installRawSource } from "@/config/noticeTestSource";
import { resetBannerStateForTests } from "@/hooks/useBannerInbox";

import {
  getNoticesSnapshot,
  refreshNotices,
  subscribeToNotices,
} from "./notices";

function staticSource(getSnapshot: () => unknown, refresh?: () => void) {
  return {
    version: 1,
    getSnapshot,
    subscribe: () => () => {},
    ...(refresh ? { refresh } : {}),
  };
}

describe("notices", () => {
  afterEach(() => {
    delete window.__TANGLE_NOTICE_SOURCE__;
    resetBannerStateForTests();
  });

  describe("getNoticesSnapshot", () => {
    it("is empty and reference-stable with no source installed", () => {
      expect(getNoticesSnapshot()).toEqual([]);
      expect(getNoticesSnapshot()).toBe(getNoticesSnapshot());
    });

    it("ignores a source declaring an unsupported major version", () => {
      installRawSource({
        version: 2,
        getSnapshot: () => [{ id: "a", title: "Later contract", body: "" }],
        subscribe: () => () => {},
      });

      expect(getNoticesSnapshot()).toEqual([]);
    });

    it("ignores a malformed source", () => {
      installRawSource({
        version: 1,
        getSnapshot: [],
        subscribe: () => () => {},
      });
      expect(getNoticesSnapshot()).toEqual([]);

      installRawSource({ version: 1, getSnapshot: () => [] });
      expect(getNoticesSnapshot()).toEqual([]);

      installRawSource("not a source");
      expect(getNoticesSnapshot()).toEqual([]);
    });

    it("survives a source whose getSnapshot throws", () => {
      installRawSource(
        staticSource(() => {
          throw new Error("host is broken");
        }),
      );

      expect(getNoticesSnapshot()).toEqual([]);
    });

    it("returns the same reference until the content changes", () => {
      let published: unknown = [{ id: "a", title: "First", body: "" }];
      installRawSource(staticSource(() => published));

      const first = getNoticesSnapshot();
      expect(first).toBe(getNoticesSnapshot());
      expect(first).toHaveLength(1);

      published = [{ id: "b", title: "Second", body: "" }];
      const second = getNoticesSnapshot();

      expect(second).not.toBe(first);
      expect(second[0]?.id).toBe("b");
    });

    it("returns the same reference to a host that rebuilds its array per read", () => {
      const notices = [{ id: "a", title: "First", body: "" }];
      installRawSource(
        staticSource(() => notices.map((notice) => ({ ...notice }))),
      );

      const first = getNoticesSnapshot();

      expect(first).toBe(getNoticesSnapshot());
      expect(first).toHaveLength(1);
    });

    it("ignores a non-array snapshot", () => {
      installRawSource(staticSource(() => ({ notices: [] })));
      expect(getNoticesSnapshot()).toEqual([]);
    });

    it("coerces an unrecognised variant to info", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "Notice", body: "", variant: "catastrophe" },
        ]),
      );

      expect(getNoticesSnapshot()[0]?.variant).toBe("info");
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

      expect(getNoticesSnapshot().map((notice) => notice.variant)).toEqual([
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

      expect(getNoticesSnapshot().map((notice) => notice.id)).toEqual(["kept"]);
    });

    it("drops entries without a title, whatever their body says", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "   ", body: "  \n " },
          { id: "b", title: "Title only", body: "" },
          { id: "c", title: "", body: "Body only" },
        ]),
      );

      expect(getNoticesSnapshot().map((notice) => notice.id)).toEqual(["b"]);
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

      const [scriptUrl, relativeUrl, absoluteUrl] = getNoticesSnapshot();

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

      expect(getNoticesSnapshot()[0]?.action?.text).toBe("Learn more");
    });

    it("only marks a notice dismissible when the host says so explicitly", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "A", body: "", dismissible: true },
          { id: "b", title: "B", body: "", dismissible: "yes" },
          { id: "c", title: "C", body: "" },
        ]),
      );

      expect(getNoticesSnapshot().map((notice) => notice.dismissible)).toEqual([
        true,
        undefined,
        undefined,
      ]);
    });

    it("coerces a numeric id to a string", () => {
      installRawSource(
        staticSource(() => [{ id: 7, title: "Numeric id", body: "" }]),
      );

      expect(getNoticesSnapshot()[0]?.id).toBe("7");
    });

    it("keeps the first of two entries sharing an id", () => {
      installRawSource(
        staticSource(() => [
          { id: "dup", title: "First wins", body: "" },
          { id: "dup", title: "Second is dropped", body: "" },
        ]),
      );

      expect(getNoticesSnapshot().map((notice) => notice.title)).toEqual([
        "First wins",
      ]);
    });

    it("caps how many entries a host can publish", () => {
      installRawSource(
        staticSource(() =>
          Array.from({ length: 500 }, (_, index) => ({
            id: `notice-${index}`,
            title: `Notice ${index}`,
            body: "",
          })),
        ),
      );

      expect(getNoticesSnapshot()).toHaveLength(20);
    });

    it("freezes each notice, not just the array", () => {
      installRawSource(
        staticSource(() => [{ id: "a", title: "Original", body: "" }]),
      );

      const snapshot = getNoticesSnapshot();
      const notice = snapshot[0];

      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(notice)).toBe(true);
      expect(() => {
        notice.title = "Mutated";
      }).toThrow();
      expect(getNoticesSnapshot()[0]?.title).toBe("Original");
    });

    it("preserves body whitespace, which is meaningful in Markdown", () => {
      installRawSource(
        staticSource(() => [
          { id: "a", title: "Notice", body: "  - indented list item" },
        ]),
      );

      expect(getNoticesSnapshot()[0]?.body).toBe("  - indented list item");
    });
  });

  describe("subscribeToNotices", () => {
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
      const unsubscribe = subscribeToNotices(listener);

      hostListeners.forEach((hostListener) => hostListener());
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(hostListeners.size).toBe(0);
    });

    it("binds to a source installed after the subscription", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToNotices(listener);

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

      const unsubscribe = subscribeToNotices(vi.fn());
      expect(() => unsubscribe()).not.toThrow();
    });

    it("rebinds and detaches around a host cleanup that throws", () => {
      const brokenCleanup = () => {
        throw new Error("host cleanup is broken");
      };
      const sourceWithBrokenCleanup = () => ({
        version: 1,
        getSnapshot: () => [],
        subscribe: vi.fn(() => brokenCleanup),
      });

      const first = sourceWithBrokenCleanup();
      installRawSource(first);
      const unsubscribe = subscribeToNotices(vi.fn());
      expect(first.subscribe).toHaveBeenCalledTimes(1);

      const replacement = sourceWithBrokenCleanup();
      installRawSource(replacement);
      expect(replacement.subscribe).toHaveBeenCalledTimes(1);

      expect(() => unsubscribe()).not.toThrow();

      const afterUnsubscribe = sourceWithBrokenCleanup();
      installRawSource(afterUnsubscribe);
      expect(afterUnsubscribe.subscribe).not.toHaveBeenCalled();
    });
  });

  describe("refreshNotices", () => {
    it("asks the host to re-fetch when it supports it", () => {
      const refresh = vi.fn();
      installRawSource(staticSource(() => [], refresh));

      refreshNotices();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when refresh is absent or throws", () => {
      installRawSource(staticSource(() => []));
      expect(() => refreshNotices()).not.toThrow();

      installRawSource(
        staticSource(
          () => [],
          () => {
            throw new Error("host is broken");
          },
        ),
      );
      expect(() => refreshNotices()).not.toThrow();
    });
  });
});
