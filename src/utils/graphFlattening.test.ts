import { beforeEach, describe, expect, it } from "vitest";

import type { ComponentSpec, TaskSpec } from "./componentSpec";
import {
  createHierarchicalId,
  flattenGraph,
  getChildTasks,
  getParentId,
  getSubgraphTasks,
  getTaskById,
  getTaskName,
  getTasksAtDepth,
  hasTask,
  hierarchicalIdToPath,
  parseHierarchicalId,
  pathToHierarchicalId,
  ROOT_ID,
} from "./graphFlattening";

// Test helper functions
const createContainerTaskSpec = (name = "test-container"): TaskSpec => ({
  componentRef: {
    spec: {
      name,
      inputs: [{ name: "input", type: "string" }],
      outputs: [{ name: "output", type: "string" }],
      implementation: {
        container: {
          image: "alpine",
          command: ["echo", "hello"],
        },
      },
    },
  },
  arguments: {},
  annotations: {},
});

const createGraphTaskSpec = (name = "test-graph", taskCount = 2): TaskSpec => ({
  componentRef: {
    spec: {
      name,
      inputs: [{ name: "input", type: "string" }],
      outputs: [{ name: "output", type: "string" }],
      implementation: {
        graph: {
          tasks: Array.from({ length: taskCount }, (_, i) => {
            const taskId = `nested-task-${i + 1}`;
            const taskSpec = createContainerTaskSpec(
              `nested-container-${i + 1}`,
            );
            return { taskId, taskSpec };
          }).reduce(
            (acc, { taskId, taskSpec }) => ({
              ...acc,
              [taskId]: taskSpec,
            }),
            {} as Record<string, TaskSpec>,
          ),
          outputValues: {},
        },
      },
    },
  },
  arguments: {},
  annotations: {},
});

const createTestComponentSpec = (): ComponentSpec => ({
  name: "root-component",
  inputs: [{ name: "rootInput", type: "string" }],
  outputs: [{ name: "rootOutput", type: "string" }],
  implementation: {
    graph: {
      tasks: {
        task1: createContainerTaskSpec("container-task-1"),
        subgraph1: createGraphTaskSpec("subgraph-1", 2),
        task2: createContainerTaskSpec("container-task-2"),
        subgraph2: createGraphTaskSpec("subgraph-2", 1),
      },
      outputValues: {},
    },
  },
});

const createNestedComponentSpec = (): ComponentSpec => ({
  name: "deeply-nested-component",
  inputs: [{ name: "input", type: "string" }],
  outputs: [{ name: "output", type: "string" }],
  implementation: {
    graph: {
      tasks: {
        level1: {
          componentRef: {
            spec: {
              name: "level1-subgraph",
              inputs: [{ name: "input", type: "string" }],
              outputs: [{ name: "output", type: "string" }],
              implementation: {
                graph: {
                  tasks: {
                    level2: {
                      componentRef: {
                        spec: {
                          name: "level2-subgraph",
                          inputs: [{ name: "input", type: "string" }],
                          outputs: [{ name: "output", type: "string" }],
                          implementation: {
                            graph: {
                              tasks: {
                                deepTask: createContainerTaskSpec("deep-task"),
                              },
                              outputValues: {},
                            },
                          },
                        },
                      },
                      arguments: {},
                      annotations: {},
                    },
                  },
                  outputValues: {},
                },
              },
            },
          },
          arguments: {},
          annotations: {},
        },
      },
      outputValues: {},
    },
  },
});

describe("graphFlattening", () => {
  describe("ID utility functions", () => {
    it("should create hierarchical IDs correctly", () => {
      expect(createHierarchicalId([ROOT_ID])).toBe("root");
      expect(createHierarchicalId([ROOT_ID, "subgraph1"])).toBe(
        "root.subgraph1",
      );
      expect(createHierarchicalId([ROOT_ID, "subgraph1", "task1"])).toBe(
        "root.subgraph1.task1",
      );
    });

    it("should parse hierarchical IDs correctly", () => {
      expect(parseHierarchicalId("root")).toEqual(["root"]);
      expect(parseHierarchicalId("root.subgraph1")).toEqual([
        "root",
        "subgraph1",
      ]);
      expect(parseHierarchicalId("root.subgraph1.task1")).toEqual([
        "root",
        "subgraph1",
        "task1",
      ]);
    });

    it("should get parent IDs correctly", () => {
      expect(getParentId("root")).toBeUndefined();
      expect(getParentId("root.subgraph1")).toBe("root");
      expect(getParentId("root.subgraph1.task1")).toBe("root.subgraph1");
    });

    it("should get task names correctly", () => {
      expect(getTaskName("root")).toBe("root");
      expect(getTaskName("root.subgraph1")).toBe("subgraph1");
      expect(getTaskName("root.subgraph1.task1")).toBe("task1");
    });

    it("should convert between paths and hierarchical IDs", () => {
      const path = ["root", "subgraph1", "task1"];
      const id = "root.subgraph1.task1";

      expect(pathToHierarchicalId(path)).toBe(id);
      expect(hierarchicalIdToPath(id)).toEqual(path);
    });
  });

  describe("flattenGraph", () => {
    it("should handle empty graph", () => {
      const emptySpec: ComponentSpec = {
        name: "empty",
        inputs: [],
        outputs: [],
        implementation: {
          graph: {
            tasks: {},
            outputValues: {},
          },
        },
      };

      const flattened = flattenGraph(emptySpec);
      expect(flattened.tasks.size).toBe(0);
      expect(flattened.originalSpec).toBe(emptySpec);
    });

    it("should handle container implementation", () => {
      const containerSpec: ComponentSpec = {
        name: "container-only",
        inputs: [],
        outputs: [],
        implementation: {
          container: {
            image: "alpine",
            command: ["echo", "hello"],
          },
        },
      };

      const flattened = flattenGraph(containerSpec);
      expect(flattened.tasks.size).toBe(0);
      expect(flattened.originalSpec).toBe(containerSpec);
    });

    it("should flatten simple graph with container tasks", () => {
      const spec = createTestComponentSpec();
      const flattened = flattenGraph(spec);

      // Should have root-level tasks + nested tasks
      // task1, subgraph1, task2, subgraph2 (4 root tasks)
      // + subgraph1's nested tasks (2) + subgraph2's nested tasks (1)
      expect(flattened.tasks.size).toBe(7);

      // Check root-level tasks
      expect(hasTask(flattened, "root.task1")).toBe(true);
      expect(hasTask(flattened, "root.subgraph1")).toBe(true);
      expect(hasTask(flattened, "root.task2")).toBe(true);
      expect(hasTask(flattened, "root.subgraph2")).toBe(true);

      // Check nested tasks
      expect(hasTask(flattened, "root.subgraph1.nested-task-1")).toBe(true);
      expect(hasTask(flattened, "root.subgraph1.nested-task-2")).toBe(true);
      expect(hasTask(flattened, "root.subgraph2.nested-task-1")).toBe(true);
    });

    it("should correctly identify subgraph tasks", () => {
      const spec = createTestComponentSpec();
      const flattened = flattenGraph(spec);

      const task1 = getTaskById(flattened, "root.task1")!;
      const subgraph1 = getTaskById(flattened, "root.subgraph1")!;
      const nestedTask = getTaskById(
        flattened,
        "root.subgraph1.nested-task-1",
      )!;

      expect(task1.isSubgraph).toBe(false);
      expect(subgraph1.isSubgraph).toBe(true);
      expect(nestedTask.isSubgraph).toBe(false);
    });

    it("should set correct depth levels", () => {
      const spec = createTestComponentSpec();
      const flattened = flattenGraph(spec);

      const rootTask = getTaskById(flattened, "root.task1")!;
      const subgraphTask = getTaskById(flattened, "root.subgraph1")!;
      const nestedTask = getTaskById(
        flattened,
        "root.subgraph1.nested-task-1",
      )!;

      expect(rootTask.depth).toBe(0);
      expect(subgraphTask.depth).toBe(0);
      expect(nestedTask.depth).toBe(1);
    });

    it("should set correct parent relationships", () => {
      const spec = createTestComponentSpec();
      const flattened = flattenGraph(spec);

      const rootTask = getTaskById(flattened, "root.task1")!;
      const subgraphTask = getTaskById(flattened, "root.subgraph1")!;
      const nestedTask = getTaskById(
        flattened,
        "root.subgraph1.nested-task-1",
      )!;

      expect(rootTask.parentId).toBeUndefined();
      expect(subgraphTask.parentId).toBeUndefined();
      expect(nestedTask.parentId).toBe("root.subgraph1");
    });

    it("should handle deeply nested structures", () => {
      const spec = createNestedComponentSpec();
      const flattened = flattenGraph(spec);

      // Should have: level1, level1.level2, level1.level2.deepTask
      expect(flattened.tasks.size).toBe(3);

      const level1 = getTaskById(flattened, "root.level1")!;
      const level2 = getTaskById(flattened, "root.level1.level2")!;
      const deepTask = getTaskById(flattened, "root.level1.level2.deepTask")!;

      expect(level1.depth).toBe(0);
      expect(level1.isSubgraph).toBe(true);
      expect(level1.parentId).toBeUndefined();

      expect(level2.depth).toBe(1);
      expect(level2.isSubgraph).toBe(true);
      expect(level2.parentId).toBe("root.level1");

      expect(deepTask.depth).toBe(2);
      expect(deepTask.isSubgraph).toBe(false);
      expect(deepTask.parentId).toBe("root.level1.level2");
    });
  });

  describe("query functions", () => {
    let flattened: ReturnType<typeof flattenGraph>;

    beforeEach(() => {
      flattened = flattenGraph(createTestComponentSpec());
    });

    it("should get tasks at specific depth", () => {
      const depth0Tasks = getTasksAtDepth(flattened, 0);
      const depth1Tasks = getTasksAtDepth(flattened, 1);

      expect(depth0Tasks).toHaveLength(4); // task1, subgraph1, task2, subgraph2
      expect(depth1Tasks).toHaveLength(3); // 2 from subgraph1, 1 from subgraph2

      expect(depth0Tasks.map((t) => t.id)).toEqual([
        "root.task1",
        "root.subgraph1",
        "root.task2",
        "root.subgraph2",
      ]);
    });

    it("should get child tasks", () => {
      const subgraph1Children = getChildTasks(flattened, "root.subgraph1");
      const subgraph2Children = getChildTasks(flattened, "root.subgraph2");
      const task1Children = getChildTasks(flattened, "root.task1");

      expect(subgraph1Children).toHaveLength(2);
      expect(subgraph2Children).toHaveLength(1);
      expect(task1Children).toHaveLength(0);

      expect(subgraph1Children.map((t) => t.id)).toEqual([
        "root.subgraph1.nested-task-1",
        "root.subgraph1.nested-task-2",
      ]);
    });

    it("should get subgraph tasks", () => {
      const subgraphs = getSubgraphTasks(flattened);

      expect(subgraphs).toHaveLength(2);
      expect(subgraphs.map((t) => t.id)).toEqual([
        "root.subgraph1",
        "root.subgraph2",
      ]);
    });

    it("should check task existence", () => {
      expect(hasTask(flattened, "root.task1")).toBe(true);
      expect(hasTask(flattened, "root.subgraph1")).toBe(true);
      expect(hasTask(flattened, "root.subgraph1.nested-task-1")).toBe(true);
      expect(hasTask(flattened, "root.nonexistent")).toBe(false);
      expect(hasTask(flattened, "root.subgraph1.nonexistent")).toBe(false);
    });

    it("should get tasks by ID", () => {
      const task = getTaskById(flattened, "root.subgraph1.nested-task-1");
      const nonexistent = getTaskById(flattened, "root.nonexistent");

      expect(task).toBeDefined();
      expect(task!.id).toBe("root.subgraph1.nested-task-1");
      expect(task!.depth).toBe(1);
      expect(task!.parentId).toBe("root.subgraph1");

      expect(nonexistent).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle tasks with missing component specs", () => {
      const specWithMissingSubSpec: ComponentSpec = {
        name: "test",
        inputs: [],
        outputs: [],
        implementation: {
          graph: {
            tasks: {
              task1: {
                componentRef: {
                  // Missing spec
                },
                arguments: {},
                annotations: {},
              },
            },
            outputValues: {},
          },
        },
      };

      const flattened = flattenGraph(specWithMissingSubSpec);
      expect(flattened.tasks.size).toBe(1);

      const task = getTaskById(flattened, "root.task1")!;
      expect(task.isSubgraph).toBe(false);
    });

    it("should handle empty task names", () => {
      expect(getTaskName("")).toBe("");
      expect(parseHierarchicalId("")).toEqual([""]);
    });

    it("should handle single-segment IDs", () => {
      expect(getParentId("single")).toBeUndefined();
      expect(getTaskName("single")).toBe("single");
    });
  });
});
