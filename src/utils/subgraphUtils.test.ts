import { describe, expect, it, vi } from "vitest";

import {
  ComponentSpecBuilder,
  componentSpecFactory,
  fixtures,
  taskSpecFactory,
} from "@/test-utils";

import type { ComponentSpec, TaskSpec } from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";
import {
  getSubgraphComponentSpec,
  getSubgraphDescription,
  isSubgraph,
  updateSubgraphSpec,
} from "./subgraphUtils";

describe("subgraphUtils", () => {
  describe("isSubgraph", () => {
    it("should return false for container tasks", () => {
      const taskSpec = taskSpecFactory.container();
      expect(isSubgraph(taskSpec)).toBe(false);
    });

    it("should return true for graph tasks", () => {
      const taskSpec = taskSpecFactory.graph();
      expect(isSubgraph(taskSpec)).toBe(true);
    });

    it("should return false for tasks without spec", () => {
      const taskSpec: TaskSpec = { componentRef: {} };
      expect(isSubgraph(taskSpec)).toBe(false);
    });
  });

  describe("getSubgraphDescription", () => {
    it("should return empty string for container tasks", () => {
      const taskSpec = taskSpecFactory.container();
      expect(getSubgraphDescription(taskSpec)).toBe("");
    });

    it("should return correct description for empty subgraph", () => {
      const taskSpec = taskSpecFactory.graph(0);
      expect(getSubgraphDescription(taskSpec)).toBe("Empty subgraph");
    });

    it("should return correct description for single task", () => {
      const taskSpec = taskSpecFactory.graph(1);
      expect(getSubgraphDescription(taskSpec)).toBe("1 task");
    });

    it("should return correct description for multiple tasks", () => {
      const taskSpec = taskSpecFactory.graph(3);
      expect(getSubgraphDescription(taskSpec)).toBe("3 tasks");
    });

    it("should not include depth information for nested subgraphs", () => {
      const nestedTaskSpec = taskSpecFactory.graph({
        "container-task": taskSpecFactory.container(),
        "subgraph-task": taskSpecFactory.graph(3),
      });

      expect(getSubgraphDescription(nestedTaskSpec)).toBe("2 tasks");
    });
  });

  describe("getSubgraphComponentSpec", () => {
    it("should return root spec for root path", () => {
      const rootSpec = componentSpecFactory.build();

      const result = getSubgraphComponentSpec(rootSpec, fixtures.paths.root);

      expect(result).toBe(rootSpec);
    });

    it("should return root spec for empty path", () => {
      const rootSpec = componentSpecFactory.build();

      const result = getSubgraphComponentSpec(rootSpec, []);

      expect(result).toBe(rootSpec);
    });

    it("should return subgraph spec at depth 1", () => {
      const subgraphSpec = componentSpecFactory.withTasks(2);
      const rootSpec = new ComponentSpecBuilder()
        .withTask("container-task", taskSpecFactory.container())
        .withTask("subgraph", taskSpecFactory.withSpec(subgraphSpec))
        .build();

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.shallow("subgraph"),
      );

      expect(result).toEqual(subgraphSpec);
    });

    it("should return deeply nested subgraph spec", () => {
      const level2Spec = new ComponentSpecBuilder()
        .withName("level2-component")
        .withTask("task1", taskSpecFactory.container())
        .build();

      const level1Spec = new ComponentSpecBuilder()
        .withName("level1-component")
        .withTask("level2-subgraph", taskSpecFactory.withSpec(level2Spec))
        .build();

      const rootSpec = new ComponentSpecBuilder()
        .withName("root-component")
        .withTask("level1-subgraph", taskSpecFactory.withSpec(level1Spec))
        .build();

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.deep("level1-subgraph", "level2-subgraph"),
      );

      expect(result).toEqual(level2Spec);
    });

    it("should handle nonexistent task gracefully", () => {
      const rootSpec = componentSpecFactory.withTasks(2);

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.shallow("nonexistent"),
      );

      expect(result).toBe(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('task "nonexistent" not found'),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle non-subgraph task gracefully", () => {
      const rootSpec = new ComponentSpecBuilder()
        .withTask("container", taskSpecFactory.container())
        .build();

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.shallow("container"),
      );

      expect(result).toBe(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('task "container" is not a subgraph'),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle task without spec gracefully", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          graph: {
            tasks: {
              "task-without-spec": { componentRef: {} },
            },
          },
        },
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.shallow("task-without-spec"),
      );

      expect(result).toBe(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('task "task-without-spec" is not a subgraph'),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle spec at root level without graph", () => {
      const rootSpec: ComponentSpec = {
        name: "root",
        implementation: {
          container: { image: "alpine" },
        },
      };

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = getSubgraphComponentSpec(
        rootSpec,
        fixtures.paths.shallow("task1"),
      );

      expect(result).toBe(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "current spec does not have graph implementation",
        ),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("updateSubgraphSpec", () => {
    it("should return updated spec directly for root path", () => {
      const rootSpec = componentSpecFactory.build();
      const updatedSpec = new ComponentSpecBuilder()
        .withName("updated-root")
        .build();

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.root,
        updatedSpec,
      );

      expect(result).toBe(updatedSpec);
      expect(result.name).toBe("updated-root");
    });

    it("should return updated spec directly for empty path", () => {
      const rootSpec = componentSpecFactory.build();
      const updatedSpec = new ComponentSpecBuilder()
        .withName("updated-root")
        .build();

      const result = updateSubgraphSpec(rootSpec, [], updatedSpec);

      expect(result).toBe(updatedSpec);
      expect(result.name).toBe("updated-root");
    });

    it("should update subgraph at depth 1", () => {
      const rootSpec = new ComponentSpecBuilder()
        .withName("root-component")
        .withInputs([{ name: "rootInput", type: "String" }])
        .withOutputs([{ name: "rootOutput", type: "String" }])
        .withTask("task1", taskSpecFactory.container())
        .withTask("subgraph1", taskSpecFactory.graph(2))
        .build();

      const updatedSubgraphSpec = new ComponentSpecBuilder()
        .withName("updated-subgraph")
        .withTask("new-task", taskSpecFactory.container())
        .build();

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("subgraph1"),
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
      const rootSpec = componentSpecFactory.nested(3);
      const updatedDeepSpec = new ComponentSpecBuilder()
        .withName("updated-level2")
        .withTask("updated-leaf", taskSpecFactory.container())
        .build();

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.deep("level3-subgraph", "level2-subgraph"),
        updatedDeepSpec,
      );

      // Navigate through the structure to verify the update
      expect(isGraphImplementation(result.implementation)).toBe(true);
      if (!isGraphImplementation(result.implementation)) return;

      const level1 =
        result.implementation.graph.tasks["level3-subgraph"]?.componentRef.spec;
      expect(level1?.name).toBe("level-2-component");

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
      const rootSpec = new ComponentSpecBuilder()
        .withName("root-component")
        .withTask("subgraph1", taskSpecFactory.graph(2))
        .build();

      const originalRootName = rootSpec.name;

      expect(isGraphImplementation(rootSpec.implementation)).toBe(true);
      if (!isGraphImplementation(rootSpec.implementation)) return;

      const originalSubgraphName =
        rootSpec.implementation.graph.tasks["subgraph1"]?.componentRef.spec
          ?.name;

      const updatedSubgraphSpec = new ComponentSpecBuilder()
        .withName("updated-subgraph")
        .build();

      updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("subgraph1"),
        updatedSubgraphSpec,
      );

      // Original spec should remain unchanged
      expect(rootSpec.name).toBe(originalRootName);
      expect(
        rootSpec.implementation.graph.tasks["subgraph1"]?.componentRef.spec
          ?.name,
      ).toBe(originalSubgraphName);
    });

    it("should handle invalid task ID gracefully", () => {
      const rootSpec = componentSpecFactory.withTasks(2);
      const updatedSpec = new ComponentSpecBuilder()
        .withName("should-not-be-applied")
        .build();

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("nonexistent"),
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
      const rootSpec = new ComponentSpecBuilder()
        .withTask("task1", taskSpecFactory.container())
        .build();

      const updatedSpec = new ComponentSpecBuilder()
        .withName("should-not-be-applied")
        .build();

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("task1"),
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
              "subgraph-without-spec": { componentRef: {} },
            },
          },
        },
      };

      const updatedSpec = new ComponentSpecBuilder()
        .withName("should-not-be-applied")
        .build();

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("subgraph-without-spec"),
        updatedSpec,
      );

      // Should return original spec unchanged
      expect(result).toEqual(rootSpec);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should create new objects at each level", () => {
      const rootSpec = componentSpecFactory.nested(3);
      const updatedSpec = new ComponentSpecBuilder()
        .withName("updated")
        .build();

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.deep("level3-subgraph", "level2-subgraph"),
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

      const level1Result = result.implementation.graph.tasks["level3-subgraph"];
      const level1Original =
        rootSpec.implementation.graph.tasks["level3-subgraph"];

      expect(level1Result).not.toBe(level1Original);
      expect(level1Result?.componentRef).not.toBe(level1Original?.componentRef);
      expect(level1Result?.componentRef.spec).not.toBe(
        level1Original?.componentRef.spec,
      );
    });

    it("should preserve sibling tasks and properties", () => {
      const rootSpec = new ComponentSpecBuilder()
        .withName("root")
        .withInputs([{ name: "input1", type: "String" }])
        .withOutputs([{ name: "output1", type: "String" }])
        .withTask("subgraph1", taskSpecFactory.graph(2))
        .withTask("subgraph2", taskSpecFactory.graph(3))
        .withTask("task1", taskSpecFactory.container())
        .withOutputValues({
          output1: { taskOutput: { taskId: "task1", outputName: "test" } },
        })
        .build();

      const updatedSpec = new ComponentSpecBuilder()
        .withName("updated-subgraph1")
        .build();

      const result = updateSubgraphSpec(
        rootSpec,
        fixtures.paths.shallow("subgraph1"),
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
});
