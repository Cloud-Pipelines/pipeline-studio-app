import { describe, expect, it, vi } from "vitest";

import type { TaskSpec } from "./componentSpec";
import {
  getSubgraphComponentSpec,
  getSubgraphDescription,
  isSubgraph,
} from "./subgraphUtils";

describe("subgraphUtils", () => {
  const createContainerTaskSpec = (): TaskSpec => ({
    componentRef: {
      spec: {
        implementation: {
          container: {
            image: "alpine",
            command: ["echo", "hello"],
          },
        },
      },
    },
  });

  const createGraphTaskSpec = (taskCount = 2): TaskSpec => ({
    componentRef: {
      spec: {
        name: "test-graph-component",
        implementation: {
          graph: {
            tasks: Object.fromEntries(
              Array.from({ length: taskCount }, (_, i) => [
                `task${i + 1}`,
                createContainerTaskSpec(),
              ]),
            ),
          },
        },
      },
    },
  });

  const createNestedGraphTaskSpec = (): TaskSpec => ({
    componentRef: {
      spec: {
        implementation: {
          graph: {
            tasks: {
              "container-task": createContainerTaskSpec(),
              "subgraph-task": createGraphTaskSpec(3),
            },
          },
        },
      },
    },
  });

  describe("isSubgraph", () => {
    it("should return false for container tasks", () => {
      const taskSpec = createContainerTaskSpec();
      expect(isSubgraph(taskSpec)).toBe(false);
    });

    it("should return true for graph tasks", () => {
      const taskSpec = createGraphTaskSpec();
      expect(isSubgraph(taskSpec)).toBe(true);
    });

    it("should return false for tasks without spec", () => {
      const taskSpec: TaskSpec = {
        componentRef: {},
      };
      expect(isSubgraph(taskSpec)).toBe(false);
    });
  });

  describe("getSubgraphDescription", () => {
    it("should return empty string for container tasks", () => {
      const taskSpec = createContainerTaskSpec();
      expect(getSubgraphDescription(taskSpec)).toBe("");
    });

    it("should return correct description for empty subgraph", () => {
      const taskSpec = createGraphTaskSpec(0);
      expect(getSubgraphDescription(taskSpec)).toBe("Empty subgraph");
    });

    it("should return correct description for single task", () => {
      const taskSpec = createGraphTaskSpec(1);
      expect(getSubgraphDescription(taskSpec)).toBe("1 task");
    });

    it("should return correct description for multiple tasks", () => {
      const taskSpec = createGraphTaskSpec(3);
      expect(getSubgraphDescription(taskSpec)).toBe("3 tasks");
    });

    it("should not include depth information for nested subgraphs", () => {
      const taskSpec = createNestedGraphTaskSpec();
      const description = getSubgraphDescription(taskSpec);
      expect(description).toBe("2 tasks");
    });
  });

  describe("getSubgraphComponentSpec", () => {
    const createRootComponentSpec = () => ({
      name: "root-component",
      inputs: [{ name: "rootInput", type: "string" }],
      outputs: [{ name: "rootOutput", type: "string" }],
      implementation: {
        graph: {
          tasks: {
            task1: createContainerTaskSpec(),
            subgraph1: createGraphTaskSpec(2),
          },
          outputValues: {},
        },
      },
    });

    it("should return original spec for root path", () => {
      const rootSpec = createRootComponentSpec();
      const result = getSubgraphComponentSpec(rootSpec, ["root"]);
      expect(result).toBe(rootSpec);
    });

    it("should return original spec for empty path", () => {
      const rootSpec = createRootComponentSpec();
      const result = getSubgraphComponentSpec(rootSpec, []);
      expect(result).toBe(rootSpec);
    });

    it("should navigate to subgraph", () => {
      const rootSpec = createRootComponentSpec();
      const result = getSubgraphComponentSpec(rootSpec, ["root", "subgraph1"]);

      // Should return the subgraph's component spec
      expect(result.name).toBe("test-graph-component");
      expect(result.implementation).toHaveProperty("graph");
    });

    it("should handle invalid task ID gracefully", () => {
      const rootSpec = createRootComponentSpec();
      const result = getSubgraphComponentSpec(rootSpec, [
        "root",
        "nonexistent",
      ]);

      // Should return original spec when navigation fails
      expect(result).toBe(rootSpec);
    });

    it("should handle non-subgraph task gracefully", () => {
      const rootSpec = createRootComponentSpec();
      const result = getSubgraphComponentSpec(rootSpec, ["root", "task1"]);

      // Should return original spec when trying to navigate into non-subgraph
      expect(result).toBe(rootSpec);
    });

    it("should call notify when task ID is invalid", () => {
      const rootSpec = createRootComponentSpec();
      const notify = vi.fn();

      const result = getSubgraphComponentSpec(
        rootSpec,
        ["root", "nonexistent"],
        notify,
      );

      expect(notify).toHaveBeenCalledWith(
        expect.stringContaining('task "nonexistent" not found'),
        "warning",
      );
      expect(result).toBe(rootSpec);
    });

    it("should call notify when task is not a subgraph", () => {
      const rootSpec = createRootComponentSpec();
      const notify = vi.fn();

      const result = getSubgraphComponentSpec(
        rootSpec,
        ["root", "task1"],
        notify,
      );

      expect(notify).toHaveBeenCalledWith(
        expect.stringContaining('task "task1" is not a subgraph'),
        "warning",
      );
      expect(result).toBe(rootSpec);
    });

    it("should call notify when task has no spec", () => {
      const rootSpec = {
        ...createRootComponentSpec(),
        implementation: {
          graph: {
            tasks: {
              "task-without-spec": {
                componentRef: {},
              },
            },
            outputValues: {},
          },
        },
      };
      const notify = vi.fn();

      const result = getSubgraphComponentSpec(
        rootSpec,
        ["root", "task-without-spec"],
        notify,
      );

      // Task without spec fails the isSubgraph check first
      expect(notify).toHaveBeenCalledWith(
        expect.stringContaining('task "task-without-spec" is not a subgraph'),
        "warning",
      );
      expect(result).toBe(rootSpec);
    });

    it("should not call notify on successful navigation", () => {
      const rootSpec = createRootComponentSpec();
      const notify = vi.fn();

      const result = getSubgraphComponentSpec(
        rootSpec,
        ["root", "subgraph1"],
        notify,
      );

      expect(notify).not.toHaveBeenCalled();
      expect(result.name).toBe("test-graph-component");
    });
  });
});
