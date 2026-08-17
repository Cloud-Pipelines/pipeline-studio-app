import { describe, expect, test } from "vitest";

import type { IoDiff, TaskDiff } from "./comparePipelines";
import { summarizeIoChange, summarizeTaskChange } from "./summarizeChange";

const taskDiff = (overrides: Partial<TaskDiff> = {}): TaskDiff => ({
  taskId: "train",
  status: "changed",
  a: { componentRef: { name: "comp", digest: "d1" } },
  b: { componentRef: { name: "comp", digest: "d1" } },
  digestA: "d1",
  digestB: "d1",
  componentChanged: false,
  cacheDisabledA: false,
  cacheDisabledB: false,
  cacheChanged: false,
  outcomeChanged: false,
  argumentDiffs: [],
  annotationDiffs: [],
  ...overrides,
});

const ioDiff = (overrides: Partial<IoDiff> = {}): IoDiff => ({
  name: "model",
  kind: "output",
  status: "changed",
  fieldDiffs: [],
  ...overrides,
});

describe("summarizeTaskChange()", () => {
  test("reports a component version change", () => {
    const summary = summarizeTaskChange(
      taskDiff({ digestA: "d1", digestB: "d2", componentChanged: true }),
    );
    expect(summary).toBe("component");
  });

  test("counts and pluralizes changed arguments", () => {
    const summary = summarizeTaskChange(
      taskDiff({
        argumentDiffs: [
          { key: "epochs", status: "changed" },
          { key: "lr", status: "new" },
          { key: "region", status: "unchanged" },
        ],
      }),
    );
    expect(summary).toBe("2 arguments");
  });

  test("combines component, arguments, and cache into one caption", () => {
    const summary = summarizeTaskChange(
      taskDiff({
        digestA: "d1",
        digestB: "d2",
        componentChanged: true,
        argumentDiffs: [{ key: "epochs", status: "changed" }],
        cacheChanged: true,
        cacheDisabledB: true,
      }),
    );
    expect(summary).toBe("component · 1 argument · cache disabled");
  });

  test("describes a cache re-enable", () => {
    const summary = summarizeTaskChange(
      taskDiff({
        cacheChanged: true,
        cacheDisabledA: true,
        cacheDisabledB: false,
      }),
    );
    expect(summary).toBe("cache enabled");
  });

  test("returns an empty string when nothing structural changed", () => {
    expect(summarizeTaskChange(taskDiff())).toBe("");
  });
});

describe("summarizeIoChange()", () => {
  test("calls out a rewired producing task alongside other changed fields", () => {
    const summary = summarizeIoChange(
      ioDiff({
        fieldDiffs: [
          { key: "source", status: "changed" },
          { key: "type", status: "changed" },
        ],
      }),
    );
    expect(summary).toBe("source rewired · 1 field changed");
  });

  test("reports a rewire on its own when nothing else changed", () => {
    const summary = summarizeIoChange(
      ioDiff({ fieldDiffs: [{ key: "source", status: "changed" }] }),
    );
    expect(summary).toBe("source rewired");
  });

  test("counts and pluralizes changed fields", () => {
    const summary = summarizeIoChange(
      ioDiff({
        fieldDiffs: [
          { key: "type", status: "changed" },
          { key: "default", status: "changed" },
          { key: "description", status: "unchanged" },
        ],
      }),
    );
    expect(summary).toBe("2 fields changed");
  });

  test("returns an empty string with no changed fields", () => {
    expect(summarizeIoChange(ioDiff({ fieldDiffs: [] }))).toBe("");
  });

  test("names an artifact difference the spec cannot show", () => {
    expect(
      summarizeIoChange(ioDiff({ fieldDiffs: [], artifactStatus: "changed" })),
    ).toBe("artifact differs");
    expect(
      summarizeIoChange(ioDiff({ fieldDiffs: [], artifactStatus: "lost" })),
    ).toBe("artifact only in A");
    expect(
      summarizeIoChange(ioDiff({ fieldDiffs: [], artifactStatus: "new" })),
    ).toBe("artifact only in B");
    expect(
      summarizeIoChange(
        ioDiff({ fieldDiffs: [], artifactStatus: "unchanged" }),
      ),
    ).toBe("");
  });
});
