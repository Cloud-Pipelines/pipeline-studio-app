import { describe, expect, it } from "vitest";

import type { ComponentSpec, TaskSpec } from "./componentSpec";
import {
  addTaskToFlattenedGraph,
  getVisibleTasksForPath,
  reconstructComponentSpec,
  removeTaskFromFlattenedGraph,
  updateTaskInFlattenedGraph,
  validateFlattenedGraph,
} from "./graphConversion";
import { flattenGraph, pathToHierarchicalId, ROOT_ID } from "./graphFlattening";

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

const createGraphTaskSpec = (
  name = "test-graph",
  tasks: Record<string, TaskSpec> = {},
): TaskSpec => ({
  componentRef: {
    spec: {
      name,
      inputs: [{ name: "input", type: "string" }],
      outputs: [{ name: "output", type: "string" }],
      implementation: {
        graph: {
          tasks,
          outputValues: {},
        },
      },
    },
  },
  arguments: {},
  annotations: {},
});

const createTestComponentSpec = (): ComponentSpec => ({
  name: "test-component",
  inputs: [{ name: "rootInput", type: "string" }],
  outputs: [{ name: "rootOutput", type: "string" }],
  implementation: {
    graph: {
      tasks: {
        task1: createContainerTaskSpec("container-1"),
        subgraph1: createGraphTaskSpec("subgraph-1", {
          nested1: createContainerTaskSpec("nested-1"),
          nested2: createContainerTaskSpec("nested-2"),
        }),
        task2: createContainerTaskSpec("container-2"),
      },
      outputValues: {
        rootOutput: {
          taskOutput: {
            taskId: "task1",
            outputName: "output",
          },
        },
      },
    },
  },
});

describe("graphConversion", () => {
  describe("reconstructComponentSpec", () => {
    it("should reconstruct a flattened graph back to original structure", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const reconstructed = reconstructComponentSpec(flattened);

      expect(reconstructed.name).toBe(originalSpec.name);
      expect(reconstructed.inputs).toEqual(originalSpec.inputs);
      expect(reconstructed.outputs).toEqual(originalSpec.outputs);

      // Check that the graph structure is preserved
      if ("graph" in reconstructed.implementation) {
        const graph = reconstructed.implementation.graph;
        expect(Object.keys(graph.tasks)).toEqual([
          "task1",
          "subgraph1",
          "task2",
        ]);
        if ("graph" in originalSpec.implementation) {
          expect(graph.outputValues).toEqual(
            originalSpec.implementation.graph.outputValues,
          );
        }

        // Check nested subgraph
        const subgraph1 = graph.tasks.subgraph1;
        if (
          subgraph1.componentRef.spec &&
          "graph" in subgraph1.componentRef.spec.implementation
        ) {
          const nestedGraph = subgraph1.componentRef.spec.implementation.graph;
          expect(Object.keys(nestedGraph.tasks)).toEqual([
            "nested1",
            "nested2",
          ]);
        } else {
          throw new Error("Subgraph1 should have a graph implementation");
        }
      } else {
        throw new Error("Reconstructed spec should have graph implementation");
      }
    });

    it("should handle container implementations", () => {
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
      const reconstructed = reconstructComponentSpec(flattened);

      expect(reconstructed).toEqual(containerSpec);
    });

    it("should preserve task annotations and arguments", () => {
      const specWithAnnotations: ComponentSpec = {
        name: "test-with-annotations",
        inputs: [],
        outputs: [],
        implementation: {
          graph: {
            tasks: {
              "annotated-task": {
                componentRef: {
                  spec: {
                    name: "annotated",
                    inputs: [],
                    outputs: [],
                    implementation: {
                      container: {
                        image: "alpine",
                        command: ["echo"],
                      },
                    },
                  },
                },
                arguments: { arg1: "value1" },
                annotations: { "editor.position": '{"x":100,"y":200}' },
              },
            },
            outputValues: {},
          },
        },
      };

      const flattened = flattenGraph(specWithAnnotations);
      const reconstructed = reconstructComponentSpec(flattened);

      if ("graph" in reconstructed.implementation) {
        const task = reconstructed.implementation.graph.tasks["annotated-task"];
        expect(task.arguments).toEqual({ arg1: "value1" });
        expect(task.annotations).toEqual({
          "editor.position": '{"x":100,"y":200}',
        });
      }
    });
  });

  describe("updateTaskInFlattenedGraph", () => {
    it("should update a task in the flattened graph", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const taskId = pathToHierarchicalId([ROOT_ID, "task1"]);

      const updatedTaskSpec = {
        ...createContainerTaskSpec("updated-container"),
        arguments: { newArg: "newValue" },
      };

      const updatedFlattened = updateTaskInFlattenedGraph(
        flattened,
        taskId,
        updatedTaskSpec,
      );

      const updatedTask = updatedFlattened.tasks.get(taskId);
      expect(updatedTask?.taskSpec.arguments).toEqual({ newArg: "newValue" });
      expect(updatedTask?.taskSpec.componentRef.spec?.name).toBe(
        "updated-container",
      );

      // Ensure other tasks are unchanged
      const otherTaskId = pathToHierarchicalId([ROOT_ID, "task2"]);
      const otherTask = updatedFlattened.tasks.get(otherTaskId);
      expect(otherTask?.taskSpec.componentRef.spec?.name).toBe("container-2");
    });

    it("should handle non-existent task gracefully", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const nonExistentId = pathToHierarchicalId([ROOT_ID, "non-existent"]);

      const updatedFlattened = updateTaskInFlattenedGraph(
        flattened,
        nonExistentId,
        createContainerTaskSpec(),
      );

      // Should return the original flattened graph unchanged
      expect(updatedFlattened).toBe(flattened);
    });
  });

  describe("addTaskToFlattenedGraph", () => {
    it("should add a new task to the root level", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const rootId = pathToHierarchicalId([ROOT_ID]);

      const newTaskSpec = createContainerTaskSpec("new-task");
      const updatedFlattened = addTaskToFlattenedGraph(
        flattened,
        rootId,
        "newTask",
        newTaskSpec,
      );

      const newTaskId = pathToHierarchicalId([ROOT_ID, "newTask"]);
      const newTask = updatedFlattened.tasks.get(newTaskId);

      expect(newTask).toBeDefined();
      expect(newTask?.taskSpec.componentRef.spec?.name).toBe("new-task");
      expect(newTask?.depth).toBe(0);
      expect(newTask?.parentId).toBeUndefined();
      expect(newTask?.path).toEqual([ROOT_ID, "newTask"]);
    });

    it("should add a new task to a subgraph", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const subgraphId = pathToHierarchicalId([ROOT_ID, "subgraph1"]);

      const newTaskSpec = createContainerTaskSpec("nested-new-task");
      const updatedFlattened = addTaskToFlattenedGraph(
        flattened,
        subgraphId,
        "nestedNew",
        newTaskSpec,
      );

      const newTaskId = pathToHierarchicalId([
        ROOT_ID,
        "subgraph1",
        "nestedNew",
      ]);
      const newTask = updatedFlattened.tasks.get(newTaskId);

      expect(newTask).toBeDefined();
      expect(newTask?.taskSpec.componentRef.spec?.name).toBe("nested-new-task");
      expect(newTask?.depth).toBe(1);
      expect(newTask?.parentId).toBe(subgraphId);
      expect(newTask?.path).toEqual([ROOT_ID, "subgraph1", "nestedNew"]);
    });

    it("should handle duplicate task names gracefully", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const rootId = pathToHierarchicalId([ROOT_ID]);

      const duplicateTaskSpec = createContainerTaskSpec("duplicate");
      const updatedFlattened = addTaskToFlattenedGraph(
        flattened,
        rootId,
        "task1", // This already exists
        duplicateTaskSpec,
      );

      // Should return the original flattened graph unchanged
      expect(updatedFlattened).toBe(flattened);
    });

    it("should handle non-existent parent gracefully", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const nonExistentParent = pathToHierarchicalId([ROOT_ID, "non-existent"]);

      const newTaskSpec = createContainerTaskSpec("orphan-task");
      const updatedFlattened = addTaskToFlattenedGraph(
        flattened,
        nonExistentParent,
        "orphan",
        newTaskSpec,
      );

      // Should return the original flattened graph unchanged
      expect(updatedFlattened).toBe(flattened);
    });
  });

  describe("removeTaskFromFlattenedGraph", () => {
    it("should remove a single task", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const taskId = pathToHierarchicalId([ROOT_ID, "task1"]);

      const updatedFlattened = removeTaskFromFlattenedGraph(flattened, taskId);

      expect(updatedFlattened.tasks.has(taskId)).toBe(false);
      expect(updatedFlattened.tasks.size).toBe(flattened.tasks.size - 1);

      // Other tasks should still exist
      const task2Id = pathToHierarchicalId([ROOT_ID, "task2"]);
      expect(updatedFlattened.tasks.has(task2Id)).toBe(true);
    });

    it("should remove a subgraph and all its children", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const subgraphId = pathToHierarchicalId([ROOT_ID, "subgraph1"]);

      const updatedFlattened = removeTaskFromFlattenedGraph(
        flattened,
        subgraphId,
      );

      // Subgraph should be removed
      expect(updatedFlattened.tasks.has(subgraphId)).toBe(false);

      // All nested tasks should be removed
      const nested1Id = pathToHierarchicalId([ROOT_ID, "subgraph1", "nested1"]);
      const nested2Id = pathToHierarchicalId([ROOT_ID, "subgraph1", "nested2"]);
      expect(updatedFlattened.tasks.has(nested1Id)).toBe(false);
      expect(updatedFlattened.tasks.has(nested2Id)).toBe(false);

      // Other root tasks should remain
      const task1Id = pathToHierarchicalId([ROOT_ID, "task1"]);
      const task2Id = pathToHierarchicalId([ROOT_ID, "task2"]);
      expect(updatedFlattened.tasks.has(task1Id)).toBe(true);
      expect(updatedFlattened.tasks.has(task2Id)).toBe(true);
    });

    it("should handle non-existent task gracefully", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);
      const nonExistentId = pathToHierarchicalId([ROOT_ID, "non-existent"]);

      const updatedFlattened = removeTaskFromFlattenedGraph(
        flattened,
        nonExistentId,
      );

      // Should return the original flattened graph unchanged
      expect(updatedFlattened).toBe(flattened);
    });
  });

  describe("getVisibleTasksForPath", () => {
    it("should return root tasks for root path", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      const visibleTasks = getVisibleTasksForPath(flattened, [ROOT_ID]);

      expect(visibleTasks).toHaveLength(3);
      expect(visibleTasks.map((t) => t.path[1])).toEqual([
        "task1",
        "subgraph1",
        "task2",
      ]);
    });

    it("should return nested tasks for subgraph path", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      const visibleTasks = getVisibleTasksForPath(flattened, [
        ROOT_ID,
        "subgraph1",
      ]);

      expect(visibleTasks).toHaveLength(2);
      expect(visibleTasks.map((t) => t.path[2])).toEqual([
        "nested1",
        "nested2",
      ]);
    });

    it("should handle empty path", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      const visibleTasks = getVisibleTasksForPath(flattened, []);

      expect(visibleTasks).toHaveLength(3); // Root level tasks
    });
  });

  describe("validateFlattenedGraph", () => {
    it("should return no errors for valid graph", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      const errors = validateFlattenedGraph(flattened);

      expect(errors).toHaveLength(0);
    });

    it("should detect invalid parent references", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      // Manually corrupt a parent reference
      const corruptedTasks = new Map(flattened.tasks);
      const taskId = pathToHierarchicalId([ROOT_ID, "subgraph1", "nested1"]);
      const task = corruptedTasks.get(taskId)!;
      corruptedTasks.set(taskId, {
        ...task,
        parentId: "invalid-parent-id",
      });

      const corruptedGraph = {
        ...flattened,
        tasks: corruptedTasks,
      };

      const errors = validateFlattenedGraph(corruptedGraph);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("invalid parent reference");
    });

    it("should detect inconsistent path and ID", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      // Manually corrupt a task's path
      const corruptedTasks = new Map(flattened.tasks);
      const taskId = pathToHierarchicalId([ROOT_ID, "task1"]);
      const task = corruptedTasks.get(taskId)!;
      corruptedTasks.set(taskId, {
        ...task,
        path: [ROOT_ID, "wrong-path"],
      });

      const corruptedGraph = {
        ...flattened,
        tasks: corruptedTasks,
      };

      const errors = validateFlattenedGraph(corruptedGraph);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("inconsistent path");
    });

    it("should detect inconsistent depth", () => {
      const originalSpec = createTestComponentSpec();
      const flattened = flattenGraph(originalSpec);

      // Manually corrupt a task's depth
      const corruptedTasks = new Map(flattened.tasks);
      const taskId = pathToHierarchicalId([ROOT_ID, "subgraph1", "nested1"]);
      const task = corruptedTasks.get(taskId)!;
      corruptedTasks.set(taskId, {
        ...task,
        depth: 5, // Wrong depth
      });

      const corruptedGraph = {
        ...flattened,
        tasks: corruptedTasks,
      };

      const errors = validateFlattenedGraph(corruptedGraph);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("inconsistent depth");
    });
  });
});
