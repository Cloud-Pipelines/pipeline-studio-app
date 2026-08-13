import { TOP_NAV_HEIGHT } from "@/utils/constants";

import {
  COLLAPSED_DOCK_AREA_WIDTH,
  type Position,
  type Size,
  WINDOW_CHROME_HEIGHT,
} from "./types";

/** Usable viewport region for placing a floating window, in viewport coordinates. */
export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Minimal store surface needed to compute floating-window viewport bounds.
 * Kept structural so both the window store and tests can satisfy it without a
 * runtime import of {@link WindowStoreImpl}.
 */
export interface ViewportBoundsStore {
  getDockAreaConfig(side: "left" | "right"): {
    collapsed: boolean;
    width: number;
  };
  getDockAreaWindowIds(side: "left" | "right"): string[];
}

/**
 * Effective horizontal space a dock area occupies. A side that has no docked
 * windows renders nothing (see DockArea's `isEmpty` early-return), so it
 * reserves no space; a collapsed side shrinks to the collapsed strip width.
 */
function effectiveDockWidth(
  store: ViewportBoundsStore,
  side: "left" | "right",
): number {
  if (store.getDockAreaWindowIds(side).length === 0) return 0;
  const area = store.getDockAreaConfig(side);
  return area.collapsed ? COLLAPSED_DOCK_AREA_WIDTH : area.width;
}

/**
 * Current usable region for floating windows: below the top nav and between the
 * left/right dock areas. Reads live `window` dimensions, so call at runtime.
 */
export function getFloatingViewportBounds(
  store: ViewportBoundsStore,
): ViewportBounds {
  return {
    left: effectiveDockWidth(store, "left"),
    top: TOP_NAV_HEIGHT,
    right: window.innerWidth - effectiveDockWidth(store, "right"),
    bottom: window.innerHeight,
  };
}

export function isFullyWithinViewport(
  position: Position,
  size: Size,
  bounds: ViewportBounds,
): boolean {
  return (
    position.x >= bounds.left &&
    position.y >= bounds.top &&
    position.x + size.width <= bounds.right &&
    position.y + size.height <= bounds.bottom
  );
}

/**
 * Reposition a window so it is fully visible within `bounds`, snapping to the
 * nearest edge. When the window is larger than the available area it pins to the
 * top-left corner (`bounds.left` / `bounds.top`) so its header stays reachable.
 */
export function bringIntoViewport(
  position: Position,
  size: Size,
  bounds: ViewportBounds,
): Position {
  return {
    x: Math.max(bounds.left, Math.min(position.x, bounds.right - size.width)),
    y: Math.max(
      bounds.top,
      Math.min(position.y, bounds.bottom - size.height - WINDOW_CHROME_HEIGHT),
    ),
  };
}
