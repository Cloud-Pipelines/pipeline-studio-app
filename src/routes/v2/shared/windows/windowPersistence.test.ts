import { afterEach, describe, expect, it } from "vitest";

import {
  clearLayout,
  migrateLayout,
  TOUR_WINDOW_LAYOUT_ID,
} from "./windowPersistence";

afterEach(() => {
  localStorage.clear();
});

describe("clearLayout", () => {
  it("removes only the targeted layout key", () => {
    localStorage.setItem("window-layout-editor", '{"editor":true}');
    localStorage.setItem("window-layout-tour", '{"tour":true}');

    clearLayout(TOUR_WINDOW_LAYOUT_ID);

    expect(localStorage.getItem("window-layout-tour")).toBeNull();
    expect(localStorage.getItem("window-layout-editor")).toBe(
      '{"editor":true}',
    );
  });

  it("is a no-op when the layout key is absent", () => {
    expect(() => clearLayout(TOUR_WINDOW_LAYOUT_ID)).not.toThrow();
    expect(localStorage.getItem("window-layout-tour")).toBeNull();
  });

  it("keeps the tour layout id distinct from the editor's", () => {
    expect(TOUR_WINDOW_LAYOUT_ID).not.toBe("editor");
  });
});

const createWindowState = (overrides = {}) => ({
  position: { x: 1472, y: 103 },
  size: { width: 280, height: 350 },
  dockState: "right" as const,
  isHidden: false,
  isMinimized: false,
  ...overrides,
});

const createLayout = (
  version: number,
  windows: Record<string, ReturnType<typeof createWindowState>>,
) => ({
  windows,
  windowOrder: Object.keys(windows),
  dockAreas: {
    left: { width: 320, collapsed: false, windowOrder: [] },
    right: { width: 320, collapsed: false, windowOrder: Object.keys(windows) },
  },
  version,
});

describe("migrateLayout", () => {
  it("drops the stamped dockedHeight from every window in a version 4 layout", () => {
    const layout = createLayout(4, {
      "pipeline-details": createWindowState({ dockedHeight: 300 }),
      history: createWindowState({ dockedHeight: 300 }),
    });

    const migrated = migrateLayout(layout);

    expect(migrated?.version).toBe(5);
    expect(migrated?.windows["pipeline-details"]).not.toHaveProperty(
      "dockedHeight",
    );
    expect(migrated?.windows.history).not.toHaveProperty("dockedHeight");
  });

  it("keeps a dockedHeight the user chose", () => {
    const layout = createLayout(4, {
      "pipeline-details": createWindowState({ dockedHeight: 300 }),
      history: createWindowState({ dockedHeight: 512.5 }),
    });

    const migrated = migrateLayout(layout);

    expect(migrated?.windows["pipeline-details"]).not.toHaveProperty(
      "dockedHeight",
    );
    expect(migrated?.windows.history.dockedHeight).toBe(512.5);
  });

  it("preserves every other window field while migrating", () => {
    const layout = createLayout(4, {
      "pipeline-details": createWindowState({
        dockedHeight: 300,
        isMinimized: true,
        preDockedSize: { width: 280, height: 350 },
      }),
    });

    const migrated = migrateLayout(layout);

    expect(migrated?.windows["pipeline-details"]).toEqual({
      position: { x: 1472, y: 103 },
      size: { width: 280, height: 350 },
      dockState: "right",
      isHidden: false,
      isMinimized: true,
      preDockedSize: { width: 280, height: 350 },
    });
    expect(migrated?.dockAreas).toEqual(layout.dockAreas);
    expect(migrated?.windowOrder).toEqual(layout.windowOrder);
  });

  it("returns a current-version layout untouched", () => {
    const layout = createLayout(5, {
      "pipeline-details": createWindowState({ dockedHeight: 250 }),
    });

    expect(migrateLayout(layout)).toBe(layout);
  });

  it("discards layouts older than version 4", () => {
    const layout = createLayout(3, {
      "pipeline-details": createWindowState(),
    });

    expect(migrateLayout(layout)).toBeNull();
  });
});
