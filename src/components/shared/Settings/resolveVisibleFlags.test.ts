import { describe, expect, it } from "vitest";

import type { Flag } from "@/types/configuration";

import { resolveVisibleFlags } from "./resolveVisibleFlags";

const createFlag = (flag: Partial<Flag> & { key: string }): Flag => ({
  name: flag.key,
  description: `${flag.key} description`,
  default: false,
  enabled: false,
  category: "beta",
  ...flag,
});

const keysOf = (flags: Flag[]) => flags.map((flag) => flag.key);

describe("resolveVisibleFlags", () => {
  it("keeps flags without a dependency", () => {
    const flags = [createFlag({ key: "a" }), createFlag({ key: "b" })];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["a", "b"]);
  });

  it("keeps a dependent flag when its dependency is enabled", () => {
    const flags = [
      createFlag({ key: "parent", enabled: true }),
      createFlag({ key: "child", dependsOn: "parent" }),
    ];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["parent", "child"]);
  });

  it("drops a dependent flag when its dependency is disabled", () => {
    const flags = [
      createFlag({ key: "parent", enabled: false }),
      createFlag({ key: "child", dependsOn: "parent" }),
    ];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["parent"]);
  });

  it("drops a dependent flag even when it is itself enabled", () => {
    const flags = [
      createFlag({ key: "parent", enabled: false }),
      createFlag({ key: "child", enabled: true, dependsOn: "parent" }),
    ];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["parent"]);
  });

  it("resolves the full dependency chain", () => {
    const flags = [
      createFlag({ key: "grandparent", enabled: false }),
      createFlag({ key: "parent", enabled: true, dependsOn: "grandparent" }),
      createFlag({ key: "child", enabled: true, dependsOn: "parent" }),
    ];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["grandparent"]);
  });

  it("drops a flag depending on an unknown key", () => {
    const flags = [createFlag({ key: "child", dependsOn: "missing" })];

    expect(resolveVisibleFlags(flags)).toEqual([]);
  });

  it("drops flags in a dependency cycle", () => {
    const flags = [
      createFlag({ key: "a", enabled: true, dependsOn: "b" }),
      createFlag({ key: "b", enabled: true, dependsOn: "a" }),
    ];

    expect(resolveVisibleFlags(flags)).toEqual([]);
  });

  it("filters settings and beta flags alike", () => {
    const flags = [
      createFlag({ key: "parent", enabled: false }),
      createFlag({
        key: "child-setting",
        category: "setting",
        dependsOn: "parent",
      }),
      createFlag({ key: "child-beta", dependsOn: "parent" }),
    ];

    expect(keysOf(resolveVisibleFlags(flags))).toEqual(["parent"]);
  });
});
