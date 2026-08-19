import { describe, expect, test } from "vitest";

import type {
  ExecutionStatusHistoryEntry,
  GetExecutionInfoResponse,
} from "@/api/types.gen";

import { runDurationMs, runOverallStatus } from "./runExecutionFacts";

const details = (
  status_history: ExecutionStatusHistoryEntry[] | undefined,
): GetExecutionInfoResponse =>
  ({
    id: "1",
    child_task_execution_ids: {},
    status_history,
  }) as GetExecutionInfoResponse;

const entry = (
  status: string,
  first_observed_at: string,
): ExecutionStatusHistoryEntry => ({ status, first_observed_at });

describe("runOverallStatus()", () => {
  test("aggregates child stats by priority", () => {
    const status = runOverallStatus({
      child_execution_status_stats: {
        e1: { SUCCEEDED: 2 },
        e2: { FAILED: 1 },
      },
    });

    expect(status).toBe("FAILED");
  });

  test("returns undefined without state", () => {
    expect(runOverallStatus(undefined)).toBeUndefined();
  });
});

describe("runDurationMs()", () => {
  test("measures first to last observed status", () => {
    const duration = runDurationMs(
      details([
        entry("PENDING", "2026-01-01T00:00:00Z"),
        entry("RUNNING", "2026-01-01T00:00:10Z"),
        entry("SUCCEEDED", "2026-01-01T00:02:30Z"),
      ]),
    );

    expect(duration).toBe(150_000);
  });

  test("reports nothing while the run is still in progress", () => {
    const duration = runDurationMs(
      details([
        entry("PENDING", "2026-01-01T00:00:00Z"),
        entry("RUNNING", "2026-01-01T00:00:10Z"),
      ]),
    );

    expect(duration).toBeUndefined();
  });

  test("reports nothing from a single entry or missing history", () => {
    expect(
      runDurationMs(details([entry("SUCCEEDED", "2026-01-01T00:00:00Z")])),
    ).toBeUndefined();
    expect(runDurationMs(details(undefined))).toBeUndefined();
    expect(runDurationMs(undefined)).toBeUndefined();
  });

  test("reports nothing for unparseable timestamps", () => {
    const duration = runDurationMs(
      details([entry("PENDING", "not-a-date"), entry("SUCCEEDED", "also-not")]),
    );

    expect(duration).toBeUndefined();
  });
});
