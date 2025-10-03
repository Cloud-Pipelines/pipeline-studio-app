import { describe, expect, it } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

import {
  buildPathKey,
  buildTaskStatusMap,
  type CachedExecutionData,
  DEFAULT_TASK_STATUS,
  extractStatusFromStats,
  findExecutionIdAtPath,
  isAtRootLevel,
  PATH_DELIMITER,
  ROOT_PATH_START_INDEX,
} from "./useCurrentLevelExecutionData";

// Test helper: Creates a minimal valid GetExecutionInfoResponse for testing
const createMockExecutionDetails = (
  childIds: Record<string, string>,
): GetExecutionInfoResponse => ({
  id: "test-execution-id",
  task_spec: { componentRef: {} },
  child_task_execution_ids: childIds,
});

// Test helper: Creates a minimal valid GetGraphExecutionStateResponse for testing
const createMockExecutionState = (
  statusStats: Record<string, Record<string, number>>,
): GetGraphExecutionStateResponse => ({
  child_execution_status_stats: statusStats,
});

describe("useCurrentLevelExecutionData helpers", () => {
  describe("constants", () => {
    it("has correct default task status", () => {
      expect(DEFAULT_TASK_STATUS).toBe("WAITING_FOR_UPSTREAM");
    });

    it("has correct path delimiter", () => {
      expect(PATH_DELIMITER).toBe(".");
    });

    it("has correct root path start index", () => {
      expect(ROOT_PATH_START_INDEX).toBe(1);
    });
  });

  describe("isAtRootLevel", () => {
    it("returns true for empty path", () => {
      expect(isAtRootLevel([])).toBe(true);
    });

    it("returns true for path with only root", () => {
      expect(isAtRootLevel(["root"])).toBe(true);
    });

    it("returns false for path with subgraph", () => {
      expect(isAtRootLevel(["root", "task-1"])).toBe(false);
    });

    it("returns false for deeply nested path", () => {
      expect(isAtRootLevel(["root", "task-1", "task-2", "task-3"])).toBe(false);
    });
  });

  describe("buildPathKey", () => {
    it("builds key for single element path", () => {
      expect(buildPathKey(["root"])).toBe("root");
    });

    it("builds key for multi-element path", () => {
      expect(buildPathKey(["root", "task-1", "task-2"])).toBe(
        "root.task-1.task-2",
      );
    });

    it("handles empty path", () => {
      expect(buildPathKey([])).toBe("");
    });

    it("uses correct delimiter", () => {
      const result = buildPathKey(["a", "b", "c"]);
      expect(result).toContain(PATH_DELIMITER);
      expect(result).toBe("a.b.c");
    });
  });

  describe("extractStatusFromStats", () => {
    it("extracts status from valid stats object", () => {
      const stats = { RUNNING: 1 };
      expect(extractStatusFromStats(stats)).toBe("RUNNING");
    });

    it("returns first status when multiple exist", () => {
      // Note: Object.keys() order is insertion order in modern JS
      const stats = { SUCCEEDED: 5, FAILED: 2 };
      const result = extractStatusFromStats(stats);
      expect(result).toBeDefined();
      expect(["SUCCEEDED", "FAILED"]).toContain(result);
    });

    it("returns undefined for empty object", () => {
      expect(extractStatusFromStats({})).toBeUndefined();
    });

    it("handles different status values", () => {
      expect(extractStatusFromStats({ WAITING_FOR_UPSTREAM: 1 })).toBe(
        "WAITING_FOR_UPSTREAM",
      );
      expect(extractStatusFromStats({ FAILED: 1 })).toBe("FAILED");
      expect(extractStatusFromStats({ SUCCEEDED: 1 })).toBe("SUCCEEDED");
    });
  });

  describe("buildTaskStatusMap", () => {
    it("returns empty map when details is undefined", () => {
      const result = buildTaskStatusMap(undefined, undefined);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("returns empty map when child_task_execution_ids is undefined", () => {
      const details = {} as GetExecutionInfoResponse;
      const result = buildTaskStatusMap(details, undefined);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("builds status map with default status when state is missing", () => {
      const details = createMockExecutionDetails({
        "task-1": "123",
        "task-2": "456",
      });

      const result = buildTaskStatusMap(details, undefined);

      expect(result.size).toBe(2);
      expect(result.get("task-1")).toBe(DEFAULT_TASK_STATUS);
      expect(result.get("task-2")).toBe(DEFAULT_TASK_STATUS);
    });

    it("builds status map with actual statuses from state", () => {
      const details = createMockExecutionDetails({
        "task-1": "123",
        "task-2": "456",
      });

      const state = createMockExecutionState({
        "123": { RUNNING: 1 },
        "456": { SUCCEEDED: 1 },
      });

      const result = buildTaskStatusMap(details, state);

      expect(result.size).toBe(2);
      expect(result.get("task-1")).toBe("RUNNING");
      expect(result.get("task-2")).toBe("SUCCEEDED");
    });

    it("uses default status when specific task status is missing", () => {
      const details = createMockExecutionDetails({
        "task-1": "123",
        "task-2": "456",
      });

      const state = createMockExecutionState({
        "123": { RUNNING: 1 },
        // task-2 (456) is missing
      });

      const result = buildTaskStatusMap(details, state);

      expect(result.size).toBe(2);
      expect(result.get("task-1")).toBe("RUNNING");
      expect(result.get("task-2")).toBe(DEFAULT_TASK_STATUS);
    });

    it("handles mixed execution ID types (numbers)", () => {
      const details = createMockExecutionDetails({
        "task-1": "12345",
      });

      const state = createMockExecutionState({
        "12345": { RUNNING: 1 },
      });

      const result = buildTaskStatusMap(details, state);

      expect(result.get("task-1")).toBe("RUNNING");
    });
  });

  describe("findExecutionIdAtPath", () => {
    it("returns root ID for root level path", () => {
      const result = findExecutionIdAtPath(
        ["root"],
        "root-exec-123",
        undefined,
        new Map(),
      );
      expect(result).toBe("root-exec-123");
    });

    it("finds execution ID one level deep", () => {
      const rootDetails = createMockExecutionDetails({
        "task-1": "456",
      });

      const result = findExecutionIdAtPath(
        ["root", "task-1"],
        "root-exec-123",
        rootDetails,
        new Map(),
      );

      expect(result).toBe("456");
    });

    it("finds execution ID two levels deep", () => {
      const rootDetails = createMockExecutionDetails({
        "task-1": "456",
      });

      const cache = new Map<string, CachedExecutionData>([
        [
          "root.task-1",
          {
            executionId: "456",
            details: createMockExecutionDetails({
              "task-2": "789",
            }),
            state: createMockExecutionState({}),
          },
        ],
      ]);

      const result = findExecutionIdAtPath(
        ["root", "task-1", "task-2"],
        "root-exec-123",
        rootDetails,
        cache,
      );

      expect(result).toBe("789");
    });

    it("uses cache to skip intermediate lookups", () => {
      const rootDetails = createMockExecutionDetails({
        "task-1": "456",
      });

      const cache = new Map<string, CachedExecutionData>([
        [
          "root.task-1.task-2",
          {
            executionId: "789",
            details: createMockExecutionDetails({}),
            state: createMockExecutionState({}),
          },
        ],
      ]);

      const result = findExecutionIdAtPath(
        ["root", "task-1", "task-2"],
        "root-exec-123",
        rootDetails,
        cache,
      );

      expect(result).toBe("789");
    });

    it("returns deepest available ID when path doesn't exist", () => {
      const rootDetails = createMockExecutionDetails({
        "task-1": "456",
      });

      // Path goes deeper than available data
      const result = findExecutionIdAtPath(
        ["root", "task-1", "task-2", "task-3"],
        "root-exec-123",
        rootDetails,
        new Map(),
      );

      // Should return the ID for task-1 since task-2 doesn't exist yet
      expect(result).toBe("456");
    });

    it("handles undefined root details gracefully", () => {
      const result = findExecutionIdAtPath(
        ["root", "task-1"],
        "root-exec-123",
        undefined,
        new Map(),
      );

      // Should return root ID since we can't traverse further
      expect(result).toBe("root-exec-123");
    });

    it("handles empty path", () => {
      const result = findExecutionIdAtPath(
        [],
        "root-exec-123",
        undefined,
        new Map(),
      );

      expect(result).toBe("root-exec-123");
    });

    it("traverses deep nested paths correctly", () => {
      const rootDetails = createMockExecutionDetails({
        "task-1": "111",
      });

      const cache = new Map<string, CachedExecutionData>([
        [
          "root.task-1",
          {
            executionId: "111",
            details: createMockExecutionDetails({ "task-2": "222" }),
            state: createMockExecutionState({}),
          },
        ],
        [
          "root.task-1.task-2",
          {
            executionId: "222",
            details: createMockExecutionDetails({ "task-3": "333" }),
            state: createMockExecutionState({}),
          },
        ],
        [
          "root.task-1.task-2.task-3",
          {
            executionId: "333",
            details: createMockExecutionDetails({ "task-4": "444" }),
            state: createMockExecutionState({}),
          },
        ],
      ]);

      const result = findExecutionIdAtPath(
        ["root", "task-1", "task-2", "task-3", "task-4"],
        "root-exec-123",
        rootDetails,
        cache,
      );

      expect(result).toBe("444");
    });
  });
});
