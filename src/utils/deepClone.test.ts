import { describe, expect, it } from "vitest";

import { deepClone } from "./deepClone";

describe("deepClone", () => {
  it("clones primitive values", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it("deep clones objects", () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.b).not.toBe(original.b);
  });

  it("deep clones arrays", () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[1]).not.toBe(original[1]);
    expect(cloned[2]).not.toBe(original[2]);
  });

  it("handles nested structures", () => {
    const original = {
      users: [
        { id: 1, name: "Alice", settings: { theme: "dark" } },
        { id: 2, name: "Bob", settings: { theme: "light" } },
      ],
      metadata: {
        count: 2,
        tags: ["user", "data"],
      },
    };

    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned.users[0]).not.toBe(original.users[0]);
    expect(cloned.users[0].settings).not.toBe(original.users[0].settings);
    expect(cloned.metadata.tags).not.toBe(original.metadata.tags);
  });

  it("preserves Date objects", () => {
    const date = new Date("2023-12-25T10:30:00Z");
    const original = { createdAt: date };
    const cloned = deepClone(original);

    expect(cloned.createdAt).toEqual(date);
    expect(cloned.createdAt).not.toBe(date);
  });
});
