import { describe, expect, it } from "vitest";

import { type Position, type Size, WINDOW_CHROME_HEIGHT } from "./types";
import {
  bringIntoViewport,
  getFloatingViewportBounds,
  isFullyWithinViewport,
  type ViewportBounds,
  type ViewportBoundsStore,
} from "./viewportUtils";

const BOUNDS: ViewportBounds = {
  left: 0,
  top: 56,
  right: 1000,
  bottom: 800,
};

const SIZE: Size = { width: 320, height: 420 };

describe("bringIntoViewport", () => {
  it("leaves a fully-visible window untouched", () => {
    const position: Position = { x: 100, y: 100 };
    expect(bringIntoViewport(position, SIZE, BOUNDS)).toEqual(position);
  });

  it("snaps a window off the right edge back to the right boundary", () => {
    const result = bringIntoViewport({ x: 5000, y: 100 }, SIZE, BOUNDS);
    expect(result.x).toBe(BOUNDS.right - SIZE.width);
    expect(result.y).toBe(100);
  });

  it("snaps a window off the bottom edge back to the bottom boundary", () => {
    const result = bringIntoViewport({ x: 100, y: 5000 }, SIZE, BOUNDS);
    expect(result.x).toBe(100);
    expect(result.y).toBe(BOUNDS.bottom - SIZE.height - WINDOW_CHROME_HEIGHT);
  });

  it("snaps a window off the left edge to the left boundary", () => {
    const result = bringIntoViewport({ x: -500, y: 100 }, SIZE, BOUNDS);
    expect(result.x).toBe(BOUNDS.left);
  });

  it("snaps a window above the top boundary down to the top", () => {
    const result = bringIntoViewport({ x: 100, y: -500 }, SIZE, BOUNDS);
    expect(result.y).toBe(BOUNDS.top);
  });

  it("pins an oversized window to the top-left corner", () => {
    const huge: Size = { width: 2000, height: 2000 };
    const result = bringIntoViewport({ x: 400, y: 400 }, huge, BOUNDS);
    expect(result).toEqual({ x: BOUNDS.left, y: BOUNDS.top });
  });

  it("respects dock-area-shrunk bounds", () => {
    const dockedBounds: ViewportBounds = {
      left: 320,
      top: 56,
      right: 680,
      bottom: 800,
    };
    const result = bringIntoViewport({ x: 0, y: 100 }, SIZE, dockedBounds);
    expect(result.x).toBe(dockedBounds.left);

    const rightResult = bringIntoViewport(
      { x: 5000, y: 100 },
      SIZE,
      dockedBounds,
    );
    expect(rightResult.x).toBe(dockedBounds.right - SIZE.width);
  });
});

describe("isFullyWithinViewport", () => {
  it("returns true when the window fits entirely", () => {
    expect(isFullyWithinViewport({ x: 100, y: 100 }, SIZE, BOUNDS)).toBe(true);
  });

  it("returns false when the window extends past the right edge", () => {
    expect(isFullyWithinViewport({ x: 900, y: 100 }, SIZE, BOUNDS)).toBe(false);
  });

  it("returns false when the window sits above the top boundary", () => {
    expect(isFullyWithinViewport({ x: 100, y: 0 }, SIZE, BOUNDS)).toBe(false);
  });
});

describe("getFloatingViewportBounds", () => {
  function makeStore(
    overrides: Partial<{
      left: { collapsed: boolean; width: number; windowIds: string[] };
      right: { collapsed: boolean; width: number; windowIds: string[] };
    }> = {},
  ): ViewportBoundsStore {
    const left = {
      collapsed: false,
      width: 320,
      windowIds: [] as string[],
      ...overrides.left,
    };
    const right = {
      collapsed: false,
      width: 320,
      windowIds: [] as string[],
      ...overrides.right,
    };
    return {
      getDockAreaConfig: (side) =>
        side === "left"
          ? { collapsed: left.collapsed, width: left.width }
          : { collapsed: right.collapsed, width: right.width },
      getDockAreaWindowIds: (side) =>
        side === "left" ? left.windowIds : right.windowIds,
    };
  }

  it("reserves no dock space when both dock areas are empty", () => {
    window.innerWidth = 1200;
    window.innerHeight = 800;
    const bounds = getFloatingViewportBounds(makeStore());
    expect(bounds).toEqual({ left: 0, top: 56, right: 1200, bottom: 800 });
  });

  it("subtracts an occupied left dock area from the usable area", () => {
    window.innerWidth = 1200;
    window.innerHeight = 800;
    const bounds = getFloatingViewportBounds(
      makeStore({ left: { collapsed: false, width: 300, windowIds: ["a"] } }),
    );
    expect(bounds.left).toBe(300);
    expect(bounds.right).toBe(1200);
  });

  it("uses the collapsed strip width for a collapsed, occupied dock area", () => {
    window.innerWidth = 1200;
    window.innerHeight = 800;
    const bounds = getFloatingViewportBounds(
      makeStore({ right: { collapsed: true, width: 300, windowIds: ["b"] } }),
    );
    expect(bounds.right).toBe(1200 - 36);
  });
});
