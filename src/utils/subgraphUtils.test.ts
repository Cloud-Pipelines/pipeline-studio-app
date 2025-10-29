import { describe, expect, it, vi } from "vitest";

import type { ComponentSpec, TaskSpec } from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";
import {
  getSubgraphComponentSpec,
  getSubgraphDescription,
  indexPathToSubgraphPath,
  isSubgraph,
  subgraphPathToIndexPath,
  updateSubgraphSpec,
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

  describe("updateSubgraphSpec", () => {
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

    const createDeeplyNestedSpec = (): ComponentSpec => ({
      name: "root-component",
      implementation: {
        graph: {
          tasks: {
            "level1-subgraph": {
              componentRef: {
                spec: {
                  name: "level1-component",
                  implementation: {
                    graph: {
                      tasks: {
                        "level2-subgraph": {
                          componentRef: {
                            spec: {
                              name: "level2-component",
                              implementation: {
                                graph: {
                                  tasks: {
                                    "leaf-task": createContainerTaskSpec(),
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          outputValues: {},
        },
      },
    });

    it("should return updated spec directly for root path", () => {
      const rootSpec = createRootComponentSpec();
      const updatedSpec: ComponentSpec = {
        ...rootSpec,
        name: "updated-root",
      };

      const result = updateSubgraphSpec(rootSpec, ["root"], updatedSpec);

      expect(result).toBe(updatedSpec);
      expect(result.name).toBe("updated-root");
    });

    it("should return updated spec directly for empty path", () => {
      const rootSpec = createRootComponentSpec();
      const updatedSpec: ComponentSpec = {
        ...rootSpec,
        name: "updated-root",
      };

      const result = updateSubgraphSpec(rootSpec, [], updatedSpec);

      expect(result).toBe(updatedSpec);
      expect(result.name).toBe("updated-root");
    });

    it("should update subgraph at depth 1", () => {
      const rootSpec = createRootComponentSpec();
      const updatedSubgraphSpec: ComponentSpec = {
        name: "updated-subgraph",
        implementation: {
          graph: {
            tasks: {
              "new-task": createContainerTaskSpec(),
            },
          },
        },
      };

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "subgraph1"],
        updatedSubgraphSpec,
      );

      // Root spec structure should be preserved
      expect(result.name).toBe("root-component");
      expect(result.inputs).toEqual(rootSpec.inputs);
      expect(result.outputs).toEqual(rootSpec.outputs);

      // Verify result has graph implementation
      expect(isGraphImplementation(result.implementation)).toBe(true);
      expect(isGraphImplementation(rootSpec.implementation)).toBe(true);
      if (!isGraphImplementation(result.implementation)) return;
      if (!isGraphImplementation(rootSpec.implementation)) return;

      // Subgraph should be updated
      const updatedSubgraph =
        result.implementation.graph.tasks["subgraph1"]?.componentRef.spec;
      expect(updatedSubgraph?.name).toBe("updated-subgraph");

      if (
        updatedSubgraph &&
        isGraphImplementation(updatedSubgraph.implementation)
      ) {
        expect(Object.keys(updatedSubgraph.implementation.graph.tasks)).toEqual(
          ["new-task"],
        );
      }

      // Other tasks should remain unchanged
      expect(result.implementation.graph.tasks["task1"]).toEqual(
        rootSpec.implementation.graph.tasks["task1"],
      );
    });

    it("should update deeply nested subgraph", () => {
      const rootSpec = createDeeplyNestedSpec();
      const updatedDeepSpec: ComponentSpec = {
        name: "updated-level2",
        implementation: {
          graph: {
            tasks: {
              "updated-leaf": createContainerTaskSpec(),
            },
          },
        },
      };

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "level1-subgraph", "level2-subgraph"],
        updatedDeepSpec,
      );

      // Navigate through the structure to verify the update
      expect(isGraphImplementation(result.implementation)).toBe(true);
      if (!isGraphImplementation(result.implementation)) return;

      const level1 =
        result.implementation.graph.tasks["level1-subgraph"]?.componentRef.spec;
      expect(level1?.name).toBe("level1-component");

      if (level1 && isGraphImplementation(level1.implementation)) {
        const level2 =
          level1.implementation.graph.tasks["level2-subgraph"]?.componentRef
            .spec;
        expect(level2?.name).toBe("updated-level2");

        if (level2 && isGraphImplementation(level2.implementation)) {
          expect(Object.keys(level2.implementation.graph.tasks)).toEqual([
            "updated-leaf",
          ]);
        }
      }
    });

    it("should maintain immutability of original spec", () => {
      const rootSpec = createRootComponentSpec();
      const originalRootName = rootSpec.name;

      expect(isGraphImplementation(rootSpec.implementation)).toBe(true);
      if (!isGraphImplementation(rootSpec.implementation)) return;

      const originalSubgraphName =
        rootSpec.implementation.graph.tasks["subgraph1"]?.componentRef.spec
          ?.name;

      const updatedSubgraphSpec: ComponentSpec = {
        name: "updated-subgraph",
        implementation: {
          graph: { tasks: {} },
        },
      };

      updateSubgraphSpec(rootSpec, ["root", "subgraph1"], updatedSubgraphSpec);

      // Original spec should remain unchanged
      expect(rootSpec.name).toBe(originalRootName);
      expect(
        rootSpec.implementation.graph.tasks["subgraph1"]?.componentRef.spec
          ?.name,
      ).toBe(originalSubgraphName);
    });

    it("should handle invalid task ID gracefully", () => {
      const rootSpec = createRootComponentSpec();
      const updatedSpec: ComponentSpec = {
        name: "should-not-be-applied",
        implementation: { graph: { tasks: {} } },
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "nonexistent"],
        updatedSpec,
      );

      // Should return original spec unchanged
      expect(result).toEqual(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('task "nonexistent" not found'),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle non-subgraph task gracefully", () => {
      const rootSpec = createRootComponentSpec();
      const updatedSpec: ComponentSpec = {
        name: "should-not-be-applied",
        implementation: { graph: { tasks: {} } },
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "task1"],
        updatedSpec,
      );

      // Should return original spec unchanged
      expect(result).toEqual(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('task "task1"'),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("is not a subgraph"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle task without spec gracefully", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          graph: {
            tasks: {
              "subgraph-without-spec": {
                componentRef: {},
              },
            },
          },
        },
      };

      const updatedSpec: ComponentSpec = {
        name: "should-not-be-applied",
        implementation: { graph: { tasks: {} } },
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "subgraph-without-spec"],
        updatedSpec,
      );

      // Should return original spec unchanged
      expect(result).toEqual(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should create new objects at each level", () => {
      const rootSpec = createDeeplyNestedSpec();
      const updatedSpec: ComponentSpec = {
        name: "updated",
        implementation: { graph: { tasks: {} } },
      };

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "level1-subgraph", "level2-subgraph"],
        updatedSpec,
      );

      // Each level should be a new object reference
      expect(result).not.toBe(rootSpec);
      expect(result.implementation).not.toBe(rootSpec.implementation);

      expect(isGraphImplementation(result.implementation)).toBe(true);
      expect(isGraphImplementation(rootSpec.implementation)).toBe(true);
      if (!isGraphImplementation(result.implementation)) return;
      if (!isGraphImplementation(rootSpec.implementation)) return;

      expect(result.implementation.graph).not.toBe(
        rootSpec.implementation.graph,
      );
      expect(result.implementation.graph.tasks).not.toBe(
        rootSpec.implementation.graph.tasks,
      );

      const level1Result = result.implementation.graph.tasks["level1-subgraph"];
      const level1Original =
        rootSpec.implementation.graph.tasks["level1-subgraph"];

      expect(level1Result).not.toBe(level1Original);
      expect(level1Result?.componentRef).not.toBe(level1Original?.componentRef);
      expect(level1Result?.componentRef.spec).not.toBe(
        level1Original?.componentRef.spec,
      );
    });

    it("should preserve sibling tasks and properties", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        inputs: [{ name: "input1", type: "string" }],
        outputs: [{ name: "output1", type: "string" }],
        implementation: {
          graph: {
            tasks: {
              subgraph1: createGraphTaskSpec(2),
              subgraph2: createGraphTaskSpec(3),
              task1: createContainerTaskSpec(),
            },
            outputValues: {
              output1: { taskOutput: { taskId: "task1", outputName: "test" } },
            },
          },
        },
      };

      const updatedSpec: ComponentSpec = {
        name: "updated-subgraph1",
        implementation: { graph: { tasks: {} } },
      };

      const result = updateSubgraphSpec(
        rootSpec,
        ["root", "subgraph1"],
        updatedSpec,
      );

      // Root properties should be preserved
      expect(result.name).toBe("root");
      expect(result.inputs).toEqual(rootSpec.inputs);
      expect(result.outputs).toEqual(rootSpec.outputs);

      expect(isGraphImplementation(result.implementation)).toBe(true);
      expect(isGraphImplementation(rootSpec.implementation)).toBe(true);
      if (!isGraphImplementation(result.implementation)) return;
      if (!isGraphImplementation(rootSpec.implementation)) return;

      expect(result.implementation.graph.outputValues).toEqual(
        rootSpec.implementation.graph.outputValues,
      );

      // Sibling tasks should be preserved
      expect(result.implementation.graph.tasks["subgraph2"]).toEqual(
        rootSpec.implementation.graph.tasks["subgraph2"],
      );
      expect(result.implementation.graph.tasks["task1"]).toEqual(
        rootSpec.implementation.graph.tasks["task1"],
      );

      // Only target subgraph should be updated
      expect(
        result.implementation.graph.tasks["subgraph1"]?.componentRef.spec?.name,
      ).toBe("updated-subgraph1");
    });
  });

  describe("subgraphPathToIndexPath", () => {
    const createRootComponentSpec = (): ComponentSpec => ({
      name: "root-component",
      implementation: {
        graph: {
          tasks: {
            "first-task": createContainerTaskSpec(),
            "second-task": createContainerTaskSpec(),
            "third-task": createGraphTaskSpec(3),
            "fourth-task": createContainerTaskSpec(),
          },
          outputValues: {},
        },
      },
    });

    const createNestedComponentSpec = (): ComponentSpec => ({
      name: "root-component",
      implementation: {
        graph: {
          tasks: {
            "task-a": createContainerTaskSpec(),
            "task-b": {
              componentRef: {
                spec: {
                  name: "level1-component",
                  implementation: {
                    graph: {
                      tasks: {
                        "level1-task-a": createContainerTaskSpec(),
                        "level1-task-b": createContainerTaskSpec(),
                        "level1-task-c": {
                          componentRef: {
                            spec: {
                              name: "level2-component",
                              implementation: {
                                graph: {
                                  tasks: {
                                    "level2-task-a": createContainerTaskSpec(),
                                    "level2-task-b": createContainerTaskSpec(),
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "task-c": createContainerTaskSpec(),
          },
          outputValues: {},
        },
      },
    });

    it("should convert root path to empty index path", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath(["root"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should convert empty path to empty index path", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath([], rootSpec);
      expect(result).toEqual([]);
    });

    it("should convert single level path to index", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath(["root", "third-task"], rootSpec);
      expect(result).toEqual(["2"]);
    });

    it("should convert first task to index 0", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath(["root", "first-task"], rootSpec);
      expect(result).toEqual(["0"]);
    });

    it("should convert last task to correct index", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath(["root", "fourth-task"], rootSpec);
      expect(result).toEqual(["3"]);
    });

    it("should convert nested path to indices", () => {
      const rootSpec = createNestedComponentSpec();
      const result = subgraphPathToIndexPath(
        ["root", "task-b", "level1-task-c"],
        rootSpec,
      );
      expect(result).toEqual(["1", "2"]);
    });

    it("should convert deeply nested path to indices", () => {
      const rootSpec = createNestedComponentSpec();
      const result = subgraphPathToIndexPath(
        ["root", "task-b", "level1-task-c", "level2-task-b"],
        rootSpec,
      );
      expect(result).toEqual(["1", "2", "1"]);
    });

    it("should return empty array for invalid task ID", () => {
      const rootSpec = createRootComponentSpec();
      const result = subgraphPathToIndexPath(
        ["root", "nonexistent-task"],
        rootSpec,
      );
      expect(result).toEqual([]);
    });

    it("should return empty array when task spec is missing", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          graph: {
            tasks: {
              "task-without-spec": {
                componentRef: {},
              },
            },
          },
        },
      };
      const result = subgraphPathToIndexPath(
        ["root", "task-without-spec"],
        rootSpec,
      );
      expect(result).toEqual([]);
    });

    it("should return empty array when current spec is not a graph", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          container: {
            image: "alpine",
            command: ["echo", "hello"],
          },
        },
      };
      const result = subgraphPathToIndexPath(["root", "any-task"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should return empty array when navigation fails mid-way", () => {
      const rootSpec = createNestedComponentSpec();
      const result = subgraphPathToIndexPath(
        ["root", "task-b", "nonexistent-task"],
        rootSpec,
      );
      expect(result).toEqual([]);
    });

    it("should handle path through multiple subgraphs", () => {
      const rootSpec = createNestedComponentSpec();
      const result = subgraphPathToIndexPath(
        ["root", "task-b", "level1-task-a"],
        rootSpec,
      );
      expect(result).toEqual(["1", "0"]);
    });
  });

  describe("indexPathToSubgraphPath", () => {
    const createRootComponentSpec = (): ComponentSpec => ({
      name: "root-component",
      implementation: {
        graph: {
          tasks: {
            "alpha-task": createContainerTaskSpec(),
            "beta-task": createContainerTaskSpec(),
            "gamma-task": createGraphTaskSpec(3),
            "delta-task": createContainerTaskSpec(),
          },
          outputValues: {},
        },
      },
    });

    const createNestedComponentSpec = (): ComponentSpec => ({
      name: "root-component",
      implementation: {
        graph: {
          tasks: {
            "root-task-1": createContainerTaskSpec(),
            "root-task-2": {
              componentRef: {
                spec: {
                  name: "nested-component",
                  implementation: {
                    graph: {
                      tasks: {
                        "nested-task-1": createContainerTaskSpec(),
                        "nested-task-2": createContainerTaskSpec(),
                        "nested-task-3": {
                          componentRef: {
                            spec: {
                              name: "deep-component",
                              implementation: {
                                graph: {
                                  tasks: {
                                    "deep-task-1": createContainerTaskSpec(),
                                    "deep-task-2": createContainerTaskSpec(),
                                    "deep-task-3": createContainerTaskSpec(),
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "root-task-3": createContainerTaskSpec(),
          },
          outputValues: {},
        },
      },
    });

    it("should convert empty index path to empty subgraph path", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath([], rootSpec);
      expect(result).toEqual([]);
    });

    it("should convert single index to task name", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["0"], rootSpec);
      expect(result).toEqual(["alpha-task"]);
    });

    it("should convert index 2 to third task name", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["2"], rootSpec);
      expect(result).toEqual(["gamma-task"]);
    });

    it("should convert last index to last task name", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["3"], rootSpec);
      expect(result).toEqual(["delta-task"]);
    });

    it("should convert nested indices to nested task names", () => {
      const rootSpec = createNestedComponentSpec();
      const result = indexPathToSubgraphPath(["1", "2"], rootSpec);
      expect(result).toEqual(["root-task-2", "nested-task-3"]);
    });

    it("should convert deeply nested indices to task names", () => {
      const rootSpec = createNestedComponentSpec();
      const result = indexPathToSubgraphPath(["1", "2", "1"], rootSpec);
      expect(result).toEqual(["root-task-2", "nested-task-3", "deep-task-2"]);
    });

    it("should return empty array for negative index", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["-1"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should return empty array for out of bounds index", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["10"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should return empty array when current spec is not a graph", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          container: {
            image: "alpine",
            command: ["echo", "hello"],
          },
        },
      };
      const result = indexPathToSubgraphPath(["0"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should return task name even when task spec is missing at final level", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          graph: {
            tasks: {
              "task-without-spec": {
                componentRef: {},
              },
            },
          },
        },
      };
      const result = indexPathToSubgraphPath(["0"], rootSpec);
      // Should return the task name since we're not trying to navigate deeper
      expect(result).toEqual(["task-without-spec"]);
    });

    it("should return empty array when trying to navigate into task without spec", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          graph: {
            tasks: {
              "task-without-spec": {
                componentRef: {},
              },
              "another-task": createContainerTaskSpec(),
            },
          },
        },
      };
      // Trying to navigate into task-without-spec should fail
      const result = indexPathToSubgraphPath(["0", "0"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should return empty array when nested navigation fails", () => {
      const rootSpec = createNestedComponentSpec();
      // root-task-1 is a container task, not a subgraph
      const result = indexPathToSubgraphPath(["0", "0"], rootSpec);
      expect(result).toEqual([]);
    });

    it("should handle complex nested indices", () => {
      const rootSpec = createNestedComponentSpec();
      const result = indexPathToSubgraphPath(["1", "0"], rootSpec);
      expect(result).toEqual(["root-task-2", "nested-task-1"]);
    });

    it("should handle string indices correctly", () => {
      const rootSpec = createRootComponentSpec();
      const result = indexPathToSubgraphPath(["0", "2", "1"], rootSpec);
      // Should fail because alpha-task is not a subgraph
      expect(result).toEqual([]);
    });
  });

  describe("Path conversion round-trips", () => {
    const createTestSpec = (): ComponentSpec => ({
      name: "test-root",
      implementation: {
        graph: {
          tasks: {
            "task-1": createContainerTaskSpec(),
            "task-2": {
              componentRef: {
                spec: {
                  name: "subgraph-1",
                  implementation: {
                    graph: {
                      tasks: {
                        "sub-task-1": createContainerTaskSpec(),
                        "sub-task-2": {
                          componentRef: {
                            spec: {
                              name: "subgraph-2",
                              implementation: {
                                graph: {
                                  tasks: {
                                    "deep-task-1": createContainerTaskSpec(),
                                    "deep-task-2": createContainerTaskSpec(),
                                  },
                                },
                              },
                            },
                          },
                        },
                        "sub-task-3": createContainerTaskSpec(),
                      },
                    },
                  },
                },
              },
            },
            "task-3": createContainerTaskSpec(),
          },
          outputValues: {},
        },
      },
    });

    it("should convert subgraph path to index path and back", () => {
      const rootSpec = createTestSpec();
      const originalPath = ["root", "task-2", "sub-task-2"];

      const indexPath = subgraphPathToIndexPath(originalPath, rootSpec);
      expect(indexPath).toEqual(["1", "1"]);

      const reconstructedPath = indexPathToSubgraphPath(indexPath, rootSpec);
      // Should get back the path without "root" prefix
      expect(reconstructedPath).toEqual(["task-2", "sub-task-2"]);
    });

    it("should convert deeply nested path round-trip", () => {
      const rootSpec = createTestSpec();
      const originalPath = ["root", "task-2", "sub-task-2", "deep-task-2"];

      const indexPath = subgraphPathToIndexPath(originalPath, rootSpec);
      expect(indexPath).toEqual(["1", "1", "1"]);

      const reconstructedPath = indexPathToSubgraphPath(indexPath, rootSpec);
      expect(reconstructedPath).toEqual([
        "task-2",
        "sub-task-2",
        "deep-task-2",
      ]);
    });

    it("should convert index path to subgraph path and back", () => {
      const rootSpec = createTestSpec();
      const originalIndexPath = ["1", "0"];

      const subgraphPath = indexPathToSubgraphPath(originalIndexPath, rootSpec);
      expect(subgraphPath).toEqual(["task-2", "sub-task-1"]);

      const reconstructedIndexPath = subgraphPathToIndexPath(
        ["root", ...subgraphPath],
        rootSpec,
      );
      expect(reconstructedIndexPath).toEqual(originalIndexPath);
    });

    it("should handle single level round-trip", () => {
      const rootSpec = createTestSpec();
      const originalPath = ["root", "task-1"];

      const indexPath = subgraphPathToIndexPath(originalPath, rootSpec);
      expect(indexPath).toEqual(["0"]);

      const reconstructedPath = indexPathToSubgraphPath(indexPath, rootSpec);
      expect(reconstructedPath).toEqual(["task-1"]);

      const backToIndex = subgraphPathToIndexPath(
        ["root", ...reconstructedPath],
        rootSpec,
      );
      expect(backToIndex).toEqual(indexPath);
    });

    it("should maintain consistency for all valid paths", () => {
      const rootSpec = createTestSpec();
      const testPaths = [
        ["root", "task-1"],
        ["root", "task-2"],
        ["root", "task-3"],
        ["root", "task-2", "sub-task-1"],
        ["root", "task-2", "sub-task-2"],
        ["root", "task-2", "sub-task-3"],
        ["root", "task-2", "sub-task-2", "deep-task-1"],
        ["root", "task-2", "sub-task-2", "deep-task-2"],
      ];

      testPaths.forEach((path) => {
        const indexPath = subgraphPathToIndexPath(path, rootSpec);
        const reconstructedPath = indexPathToSubgraphPath(indexPath, rootSpec);

        // Remove "root" from original path for comparison
        const pathWithoutRoot = path.slice(1);
        expect(reconstructedPath).toEqual(pathWithoutRoot);

        // Convert back to verify consistency
        const backToIndex = subgraphPathToIndexPath(
          ["root", ...reconstructedPath],
          rootSpec,
        );
        expect(backToIndex).toEqual(indexPath);
      });
    });
  });
});
