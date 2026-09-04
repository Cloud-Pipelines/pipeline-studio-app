import { afterEach, describe, expect, it } from "vitest";

import { getExtraNavItems } from "./extraNavItems";

describe("extraNavItems", () => {
  afterEach(() => {
    delete window.__TANGLE_EXTRA_NAV_ITEMS__;
  });

  it("returns nothing when the host page injects no items", () => {
    expect(getExtraNavItems(["admin"])).toEqual([]);
  });

  it("returns items that require no permission", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "Runbook", href: "https://example.com/runbook", external: true },
    ];

    expect(getExtraNavItems([])).toEqual([
      { label: "Runbook", href: "https://example.com/runbook", external: true },
    ]);
  });

  it("hides items whose required permission the user lacks", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      {
        label: "Admin",
        href: "/admin/",
        icon: "ShieldCheck",
        requiresPermission: "admin",
      },
    ];

    expect(getExtraNavItems(["read", "write"])).toEqual([]);
    expect(getExtraNavItems(["read", "write", "admin"])).toEqual([
      {
        label: "Admin",
        href: "/admin/",
        icon: "ShieldCheck",
        requiresPermission: "admin",
      },
    ]);
  });

  it("drops items without a usable label or href", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "   ", href: "/admin/" },
      { label: "No href" } as never,
      "not an object" as never,
    ];

    expect(getExtraNavItems([])).toEqual([]);
  });

  it("rejects hrefs that are neither same-origin paths nor http(s) URLs", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "Script", href: "javascript:alert(1)" },
      { label: "Data", href: "data:text/html,<script>alert(1)</script>" },
      { label: "Relative", href: "admin/" },
    ];

    expect(getExtraNavItems([])).toEqual([]);
  });

  it("rejects leading-slash hrefs that resolve off-origin", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "Protocol relative", href: "//evil.com" },
      { label: "Backslash authority", href: "/\\evil.com" },
    ];

    expect(getExtraNavItems([])).toEqual([]);
  });

  it("keeps the path, query and hash of a same-origin href", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "Admin", href: "/admin/?tab=users#top" },
    ];

    expect(getExtraNavItems([])).toEqual([
      { label: "Admin", href: "/admin/?tab=users#top" },
    ]);
  });

  it("keeps an item but drops an icon name the icon set does not have", () => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      { label: "Admin", href: "/admin/", icon: "NotARealIcon" as never },
    ];

    expect(getExtraNavItems([])).toEqual([{ label: "Admin", href: "/admin/" }]);
  });
});
