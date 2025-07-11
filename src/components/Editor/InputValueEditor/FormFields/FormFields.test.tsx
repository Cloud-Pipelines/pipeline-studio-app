import { describe, expect, it } from "vitest";

import { deselectAllNodes } from "@/utils/flowUtils";

type MockNode = {
  id: string;
  selected: boolean;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

const makeNode = (id: string, selected: boolean = false): MockNode => ({
  id,
  selected,
  position: { x: 0, y: 0 },
  data: {},
});

describe("deselectAllNodes", () => {
  it("deselects all nodes when all are selected", () => {
    const nodes = [makeNode("1", true), makeNode("2", true)];
    const result = deselectAllNodes(nodes);
    expect(result.every((node) => node.selected === false)).toBe(true);
  });

  it("deselects all nodes when some are selected", () => {
    const nodes = [makeNode("1", true), makeNode("2", false)];
    const result = deselectAllNodes(nodes as any);
    expect(result.every((node) => node.selected === false)).toBe(true);
  });

  it("leaves all nodes unselected if none are selected", () => {
    const nodes = [makeNode("1", false), makeNode("2", false)];
    const result = deselectAllNodes(nodes as any);
    expect(result.every((node) => node.selected === false)).toBe(true);
  });

  it("returns an empty array if given an empty array", () => {
    const result = deselectAllNodes([]);
    expect(result).toEqual([]);
  });
});
