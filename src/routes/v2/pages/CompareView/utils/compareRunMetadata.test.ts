import { describe, expect, test } from "vitest";

import { buildRunMetadataComparison } from "./compareRunMetadata";

describe("buildRunMetadataComparison()", () => {
  test("flags an author change but ignores a differing timestamp", () => {
    const result = buildRunMetadataComparison(
      { createdBy: "alice", createdAt: "2026-01-01T00:00:00Z" },
      { createdBy: "bob", createdAt: "2026-02-02T00:00:00Z" },
    );

    expect(result.author.changed).toBe(true);
    expect(result.createdAt.changed).toBe(true);
    expect(result.hasChanges).toBe(true);
    expect(result.changeCount).toBe(1);
  });

  test("does not treat a differing timestamp alone as a change", () => {
    const result = buildRunMetadataComparison(
      { createdBy: "alice", createdAt: "2026-01-01T00:00:00Z" },
      { createdBy: "alice", createdAt: "2026-02-02T00:00:00Z" },
    );

    expect(result.hasChanges).toBe(false);
    expect(result.changeCount).toBe(0);
  });

  test("surfaces an arbitrary run-annotation key change generically", () => {
    const result = buildRunMetadataComparison(
      { annotations: { "run.serviceAccount": "svc-a@project" } },
      { annotations: { "run.serviceAccount": "svc-b@project" } },
    );

    const entry = result.annotationDiffs.find(
      (diff) => diff.key === "run.serviceAccount",
    );
    expect(entry?.status).toBe("changed");
    expect(result.hasChanges).toBe(true);
  });

  test("excludes superficial and frontend-only annotations", () => {
    const result = buildRunMetadataComparison(
      {
        annotations: {
          notes: "first run",
          tags: "a,b",
          "editor.position": "{x:0}",
        },
      },
      {
        annotations: {
          notes: "second run",
          tags: "c,d",
          "editor.position": "{x:9}",
        },
      },
    );

    expect(result.annotationDiffs).toHaveLength(0);
    expect(result.hasChanges).toBe(false);
  });

  test("counts a differing run status", () => {
    const result = buildRunMetadataComparison(
      { status: "SUCCEEDED" },
      { status: "FAILED" },
    );

    expect(result.status.changed).toBe(true);
    expect(result.changeCount).toBe(1);
  });

  test("does not report a status difference while one side is still loading", () => {
    const result = buildRunMetadataComparison({ status: "SUCCEEDED" }, {});

    expect(result.status.changed).toBe(false);
    expect(result.hasChanges).toBe(false);
  });

  test("counts a duration gap that is both large and proportionally big", () => {
    const result = buildRunMetadataComparison(
      { durationMs: 30_000 },
      { durationMs: 120_000 },
    );

    expect(result.duration.changed).toBe(true);
    expect(result.changeCount).toBe(1);
  });

  test("ignores a duration gap within scheduling noise", () => {
    const proportionallyBigButTiny = buildRunMetadataComparison(
      { durationMs: 1_000 },
      { durationMs: 3_000 },
    );
    const absolutelyBigButProportionallySmall = buildRunMetadataComparison(
      { durationMs: 600_000 },
      { durationMs: 610_000 },
    );

    expect(proportionallyBigButTiny.duration.changed).toBe(false);
    expect(absolutelyBigButProportionallySmall.duration.changed).toBe(false);
  });

  test("does not report a duration difference while one side is unknown", () => {
    const result = buildRunMetadataComparison({ durationMs: 30_000 }, {});

    expect(result.duration.changed).toBe(false);
    expect(result.hasChanges).toBe(false);
  });

  test("diffs run arguments generically", () => {
    const result = buildRunMetadataComparison(
      { arguments: { epochs: "10", region: "us" } },
      { arguments: { epochs: "20", region: "us" } },
    );

    const epochs = result.argumentDiffs.find((diff) => diff.key === "epochs");
    const region = result.argumentDiffs.find((diff) => diff.key === "region");
    expect(epochs?.status).toBe("changed");
    expect(region?.status).toBe("unchanged");
    expect(result.changeCount).toBe(1);
  });
});
