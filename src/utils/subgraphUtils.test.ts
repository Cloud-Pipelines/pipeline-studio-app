import { describe, expect, it } from "vitest";

import type { TaskSpec } from "./componentSpec";
import {
  getSubgraphDescription,
  getSubgraphTaskCount,
  isSubgraph,
  isSubgraphTaskSpec,
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

  describe("isSubgraphTaskSpec", () => {
    it("should work as a type guard", () => {
      const taskSpec = createGraphTaskSpec();
      if (isSubgraphTaskSpec(taskSpec)) {
        // This should compile without type errors
        expect(taskSpec.componentRef.spec.implementation.graph).toBeDefined();
      }
    });
  });

  describe("getSubgraphTaskCount", () => {
    it("should return 0 for container tasks", () => {
      const taskSpec = createContainerTaskSpec();
      expect(getSubgraphTaskCount(taskSpec)).toBe(0);
    });

    it("should return correct task count for graph tasks", () => {
      const taskSpec = createGraphTaskSpec(3);
      expect(getSubgraphTaskCount(taskSpec)).toBe(3);
    });

    it("should return 0 for empty graphs", () => {
      const taskSpec = createGraphTaskSpec(0);
      expect(getSubgraphTaskCount(taskSpec)).toBe(0);
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
});
