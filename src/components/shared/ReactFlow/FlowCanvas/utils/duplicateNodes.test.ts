import type { Node } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";

import { NodeManager } from "@/nodeManager";
import type { TaskNodeData } from "@/types/nodes";
import {
  type ComponentSpec,
  type InputSpec,
  isGraphImplementation,
  type OutputSpec,
  type TaskOutputArgument,
  type TaskSpec,
} from "@/utils/componentSpec";

import { duplicateNodes } from "./duplicateNodes";

const createMockNodeManager = () => new NodeManager();

// Mock utility functions
const mockTaskSpec: TaskSpec = {
  componentRef: { name: "test-component" },
  arguments: {},
  annotations: {},
};

const mockInputSpec: InputSpec = {
  name: "test-input",
  type: "String",
  annotations: {},
};

const mockOutputSpec: OutputSpec = {
  name: "test-output",
  type: "String",
  annotations: {},
};

const createMockComponentSpec = (
  tasks: Record<string, TaskSpec> = {},
  inputs: InputSpec[] = [],
): ComponentSpec => ({
  name: "test-component",
  inputs,
  implementation: {
    graph: {
      tasks,
    },
  },
});

const createMockComponentSpecWithOutputs = (
  tasks: Record<string, TaskSpec> = {},
  inputs: InputSpec[] = [],
  outputs: OutputSpec[] = [],
): ComponentSpec => ({
  name: "test-component",
  inputs,
  outputs,
  implementation: {
    graph: {
      tasks,
      outputValues: outputs.reduce<Record<string, TaskOutputArgument>>(
        (acc, output) => {
          acc[output.name] = {
            taskOutput: {
              taskId: "task1",
              outputName: output.name,
            },
          };
          return acc;
        },
        {},
      ),
    },
  },
});

// Create mock callbacks that match the expected shape
const createMockTaskNodeCallbacks = () => ({
  setArguments: vi.fn(),
  setAnnotations: vi.fn(),
  setCacheStaleness: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onUpgrade: vi.fn(),
});

const createMockTaskNode = (
  taskId: string,
  taskSpec: TaskSpec,
  nodeManager: NodeManager,
  position = { x: 100, y: 100 },
): Node<TaskNodeData> => {
  const nodeId = nodeManager.getNodeId(taskId, "task");
  return {
    id: nodeId,
    type: "task",
    position,
    data: {
      taskSpec,
      taskId,
      label: "Test Task",
      highlighted: false,
      readOnly: false,
      isGhost: false,
      connectable: true,
      callbacks: createMockTaskNodeCallbacks(),
    },
    selected: false,
    dragging: false,
    measured: { width: 200, height: 100 },
  };
};

const createMockInputNode = (
  inputName: string,
  nodeManager: NodeManager,
  position = { x: 50, y: 50 },
): Node => {
  const nodeId = nodeManager.getNodeId(inputName, "input");

  return {
    id: nodeId,
    type: "input",
    position,
    data: {
      label: inputName,
      spec: { ...mockInputSpec, name: inputName },
    },
    selected: false,
    dragging: false,
    measured: { width: 150, height: 80 },
  };
};

const createMockOutputNode = (
  outputName: string,
  nodeManager: NodeManager,
  position = { x: 300, y: 300 },
): Node => {
  const nodeId = nodeManager.getNodeId(outputName, "output");

  return {
    id: nodeId,
    type: "output",
    position,
    data: {
      label: outputName,
      spec: { ...mockOutputSpec, name: outputName },
    },
    selected: false,
    dragging: false,
    measured: { width: 150, height: 80 },
  };
};

describe("duplicateNodes", () => {
  describe("error handling", () => {
    it("should throw error when componentSpec does not have graph implementation", () => {
      const componentSpec: ComponentSpec = {
        name: "test",
        implementation: {
          container: {
            image: "test-image",
          },
        },
      };

      const nodes: Node[] = [];
      const nodeManager = createMockNodeManager();

      expect(() => duplicateNodes(componentSpec, nodes, nodeManager)).toThrow(
        "ComponentSpec does not contain a graph implementation.",
      );
    });
  });

  describe("basic duplication", () => {
    it("should duplicate a single task node with default config", () => {
      const originalTaskSpec = {
        ...mockTaskSpec,
        annotations: {
          "editor.position": JSON.stringify({ x: 100, y: 100 }),
        },
      };

      const componentSpec = createMockComponentSpec({
        "original-task": originalTaskSpec,
      });

      const nodeManager = createMockNodeManager();

      const taskNode = createMockTaskNode(
        "original-task",
        originalTaskSpec,
        nodeManager,
        {
          x: 100,
          y: 100,
        },
      );

      const result = duplicateNodes(componentSpec, [taskNode], nodeManager);

      expect(result.newNodes).toHaveLength(1);
      expect(result.newNodes[0].type).toBe("task");
      expect(result.newNodes[0].position).toEqual({ x: 110, y: 110 });
      expect(result.newNodes[0].selected).toBe(true);

      // Check that the new task spec is created
      expect(result.updatedComponentSpec.implementation).toBeDefined();
      if ("graph" in result.updatedComponentSpec.implementation!) {
        expect(
          result.updatedComponentSpec.implementation.graph.tasks,
        ).toHaveProperty("original-task (2)");
      }
    });

    it("should duplicate a single input node", () => {
      const inputSpec = {
        ...mockInputSpec,
        name: "original-input",
        annotations: {
          "editor.position": JSON.stringify({ x: 50, y: 50 }),
        },
      };

      const componentSpec = createMockComponentSpec({}, [inputSpec]);

      const nodeManager = createMockNodeManager();
      const inputNode = createMockInputNode("original-input", nodeManager, {
        x: 50,
        y: 50,
      });

      const result = duplicateNodes(componentSpec, [inputNode], nodeManager);

      expect(result.newNodes).toHaveLength(1);
      expect(result.newNodes[0].type).toBe("input");
      expect(result.newNodes[0].id).toBe(
        nodeManager.getNodeId("original-input (2)", "input"),
      );
      expect(result.newNodes[0].position).toEqual({ x: 60, y: 60 });

      expect(result.updatedComponentSpec.inputs).toHaveLength(2);
      expect(
        result.updatedComponentSpec.inputs?.some(
          (input) => input.name === "original-input (2)",
        ),
      ).toBe(true);
    });

    it("should duplicate a single output node", () => {
      const outputSpec = {
        ...mockOutputSpec,
        name: "original-output",
        annotations: {
          "editor.position": JSON.stringify({ x: 300, y: 300 }),
        },
      };

      const componentSpec = createMockComponentSpecWithOutputs(
        {},
        [],
        [outputSpec],
      );

      const nodeManager = createMockNodeManager();
      const outputNode = createMockOutputNode("original-output", nodeManager, {
        x: 300,
        y: 300,
      });

      const result = duplicateNodes(componentSpec, [outputNode], nodeManager);

      expect(result.newNodes).toHaveLength(1);
      expect(result.newNodes[0].type).toBe("output");
      expect(result.newNodes[0].id).toBe(
        nodeManager.getNodeId("original-output (2)", "output"),
      );
      expect(result.newNodes[0].position).toEqual({ x: 310, y: 310 });

      expect(result.updatedComponentSpec.outputs).toHaveLength(2);
      expect(
        result.updatedComponentSpec.outputs?.some(
          (output) => output.name === "original-output (2)",
        ),
      ).toBe(true);
    });

    it("should handle multiple nodes", () => {
      const taskSpec1 = { ...mockTaskSpec };
      const taskSpec2 = { ...mockTaskSpec };

      const componentSpec = createMockComponentSpec({
        task1: taskSpec1,
        task2: taskSpec2,
      });

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", taskSpec1, nodeManager, { x: 100, y: 100 }),
        createMockTaskNode("task2", taskSpec2, nodeManager, { x: 200, y: 200 }),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager);

      expect(result.newNodes).toHaveLength(2);
      if (isGraphImplementation(result.updatedComponentSpec.implementation)) {
        expect(
          result.updatedComponentSpec.implementation.graph.tasks,
        ).toHaveProperty("task1 (2)");
        expect(
          result.updatedComponentSpec.implementation.graph.tasks,
        ).toHaveProperty("task2 (2)");
      }
    });
  });

  describe("configuration options", () => {
    it("should respect selected: false config", () => {
      const componentSpec = createMockComponentSpec({
        "original-task": mockTaskSpec,
      });

      const nodeManager = createMockNodeManager();
      const taskNode = createMockTaskNode(
        "original-task",
        mockTaskSpec,
        nodeManager,
      );
      taskNode.selected = true;

      const result = duplicateNodes(componentSpec, [taskNode], nodeManager, {
        selected: false,
      });

      expect(result.newNodes[0].selected).toBe(false);
      expect(taskNode.selected).toBe(true);
    });

    it("should position nodes at specified location", () => {
      const componentSpec = createMockComponentSpec({
        task1: mockTaskSpec,
        task2: mockTaskSpec,
      });

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", mockTaskSpec, nodeManager, {
          x: 100,
          y: 100,
        }),
        createMockTaskNode("task2", mockTaskSpec, nodeManager, {
          x: 200,
          y: 200,
        }),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        position: { x: 500, y: 500 },
      });

      // Note: expected positions are calculated to account for node dimensions (width: 200, height: 100 in these tests)
      expect(result.newNodes[0].position).toEqual({ x: 350, y: 400 });
      expect(result.newNodes[1].position).toEqual({ x: 450, y: 500 });
    });
  });

  describe("connection modes", () => {
    const createConnectedTasks = () => {
      const task1: TaskSpec = {
        ...mockTaskSpec,
        arguments: {},
      };

      const task2: TaskSpec = {
        ...mockTaskSpec,
        arguments: {
          input1: {
            taskOutput: {
              taskId: "task1",
              outputName: "output1",
            },
          },
        },
      };

      const task3: TaskSpec = {
        ...mockTaskSpec,
        arguments: {
          input1: {
            taskOutput: {
              taskId: "task1",
              outputName: "output1",
            },
          },
        },
      };

      return { task1, task2, task3 };
    };

    it("should handle connection mode: none", () => {
      const { task1, task2 } = createConnectedTasks();
      const componentSpec = createMockComponentSpec({
        task1,
        task2,
      });

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", task1, nodeManager),
        createMockTaskNode("task2", task2, nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "none",
      });

      if ("graph" in result.updatedComponentSpec.implementation!) {
        const duplicatedTask2 =
          result.updatedComponentSpec.implementation.graph.tasks["task2 (2)"];
        expect(duplicatedTask2.arguments).toEqual({});
      }
    });

    it("should handle connection mode: internal", () => {
      const { task1, task2 } = createConnectedTasks();
      const componentSpec = createMockComponentSpec({
        task1,
        task2,
      });

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", task1, nodeManager),
        createMockTaskNode("task2", task2, nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "internal",
      });

      if ("graph" in result.updatedComponentSpec.implementation!) {
        const duplicatedTask2 =
          result.updatedComponentSpec.implementation.graph.tasks["task2 (2)"];
        expect(duplicatedTask2.arguments?.input1).toEqual({
          taskOutput: {
            taskId: "task1 (2)",
            outputName: "output1",
          },
        });
      }
    });

    it("should handle connection mode: external", () => {
      // Create a scenario where we duplicate some nodes but not others
      const task1: TaskSpec = { ...mockTaskSpec, arguments: {} };
      const task2: TaskSpec = { ...mockTaskSpec, arguments: {} };
      const task3: TaskSpec = { ...mockTaskSpec, arguments: {} };

      const task2WithConnections: TaskSpec = {
        ...task2,
        arguments: {
          input1: {
            taskOutput: {
              taskId: "task1", // Internal connection (task1 will be duplicated)
              outputName: "output1",
            },
          },
          input2: {
            taskOutput: {
              taskId: "task3", // External connection (task3 won't be duplicated)
              outputName: "output1",
            },
          },
        },
      };

      const componentSpec = createMockComponentSpec({
        task1,
        task2: task2WithConnections,
        task3,
      });

      const nodeManager = createMockNodeManager();
      // Duplicate task1 and task2, but NOT task3
      const nodes = [
        createMockTaskNode("task1", task1, nodeManager),
        createMockTaskNode("task2", task2WithConnections, nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "external",
      });

      if ("graph" in result.updatedComponentSpec.implementation!) {
        const duplicatedTask2 =
          result.updatedComponentSpec.implementation.graph.tasks["task2 (2)"];

        // Should remove internal connection to task1 (since task1 is being duplicated)
        expect(duplicatedTask2.arguments?.input1).toBeUndefined();

        // Should keep external connection to task3 (since task3 is NOT being duplicated)
        expect(duplicatedTask2.arguments?.input2).toEqual({
          taskOutput: {
            taskId: "task3",
            outputName: "output1",
          },
        });
      }
    });

    it("should handle connection mode: all", () => {
      const { task1, task2 } = createConnectedTasks();
      const componentSpec = createMockComponentSpec({
        task1,
        task2,
      });

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", task1, nodeManager),
        createMockTaskNode("task2", task2, nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "all",
      });

      if ("graph" in result.updatedComponentSpec.implementation!) {
        const duplicatedTask2 =
          result.updatedComponentSpec.implementation.graph.tasks["task2 (2)"];
        expect(duplicatedTask2.arguments?.input1).toEqual({
          taskOutput: {
            taskId: "task1 (2)",
            outputName: "output1",
          },
        });
      }
    });

    it("should handle graph input connections", () => {
      const inputSpec: InputSpec = {
        ...mockInputSpec,
        name: "graph-input",
      };

      const taskSpec: TaskSpec = {
        ...mockTaskSpec,
        arguments: {
          input1: {
            graphInput: {
              inputName: "graph-input",
            },
          },
        },
      };

      const componentSpec = createMockComponentSpec({ task1: taskSpec }, [
        inputSpec,
      ]);

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockInputNode("graph-input", nodeManager),
        createMockTaskNode("task1", taskSpec, nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "all",
      });

      if (isGraphImplementation(result.updatedComponentSpec.implementation)) {
        const duplicatedTask =
          result.updatedComponentSpec.implementation.graph.tasks["task1 (2)"];
        expect(duplicatedTask.arguments?.input1).toEqual({
          graphInput: {
            inputName: "graph-input (2)",
          },
        });
      }
    });

    it("should handle graph output connections", () => {
      const outputSpec: OutputSpec = {
        ...mockOutputSpec,
        name: "graph-output-node",
      };

      const taskComponentSpec: ComponentSpec = {
        name: "task-component",
        inputs: [],
        outputs: [
          {
            name: "graph-output",
            type: "String",
            annotations: {},
          },
        ],
        implementation: {
          container: { image: "task-image" },
        },
      };

      const taskSpec: TaskSpec = {
        ...mockTaskSpec,
        arguments: {},
        componentRef: {
          name: "task-component",
          spec: taskComponentSpec,
        },
      };

      const componentSpec = createMockComponentSpecWithOutputs(
        { task1: taskSpec },
        [],
        [outputSpec],
      );

      const nodeManager = createMockNodeManager();
      const nodes = [
        createMockTaskNode("task1", taskSpec, nodeManager),
        createMockOutputNode("graph-output-node", nodeManager),
      ];

      const result = duplicateNodes(componentSpec, nodes, nodeManager, {
        connection: "all",
      });

      // Check that outputValues are updated for duplicated outputs
      if (isGraphImplementation(result.updatedComponentSpec.implementation)) {
        const outputValues =
          result.updatedComponentSpec.implementation.graph.outputValues;

        // Duplicated output should reference duplicated task
        expect(outputValues?.["graph-output-node (2)"]).toEqual({
          taskOutput: {
            taskId: "task1 (2)",
            outputName: "graph-output-node",
          },
        });
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty node array", () => {
      const componentSpec = createMockComponentSpec();
      const nodeManager = createMockNodeManager();
      const result = duplicateNodes(componentSpec, [], nodeManager);

      expect(result.newNodes).toHaveLength(0);
      expect(result.nodeIdMap).toEqual({});
    });

    it("should preserve node measurements", () => {
      const componentSpec = createMockComponentSpec({
        "original-task": mockTaskSpec,
      });

      const nodeManager = createMockNodeManager();
      const taskNode = createMockTaskNode(
        "original-task",
        mockTaskSpec,
        nodeManager,
      );
      taskNode.measured = { width: 300, height: 200 };

      const result = duplicateNodes(componentSpec, [taskNode], nodeManager);

      expect(result.newNodes[0].measured).toEqual({ width: 300, height: 200 });
    });

    it("should handle nodes without position annotations", () => {
      const taskSpecWithoutPosition = {
        ...mockTaskSpec,
        annotations: {},
      };

      const componentSpec = createMockComponentSpec({
        "original-task": taskSpecWithoutPosition,
      });

      const nodeManager = createMockNodeManager();
      const taskNode = createMockTaskNode(
        "original-task",
        taskSpecWithoutPosition,
        nodeManager,
      );

      const result = duplicateNodes(componentSpec, [taskNode], nodeManager);

      expect(result.newNodes).toHaveLength(1);
      expect(result.newNodes[0].position).toEqual({ x: 110, y: 110 });
    });
  });

  describe("return values", () => {
    it("should return correct structure", () => {
      const componentSpec = createMockComponentSpec({
        "original-task": mockTaskSpec,
      });

      const nodeManager = createMockNodeManager();
      const taskNode = createMockTaskNode(
        "original-task",
        mockTaskSpec,
        nodeManager,
      );
      const originalNodeId = taskNode.id;

      const result = duplicateNodes(componentSpec, [taskNode], nodeManager);

      expect(result).toHaveProperty("updatedComponentSpec");
      expect(result).toHaveProperty("nodeIdMap");
      expect(result).toHaveProperty("newNodes");
      expect(result).toHaveProperty("updatedNodes");

      expect(result.nodeIdMap).toHaveProperty(originalNodeId);

      expect(result.updatedNodes).toHaveLength(1);
      expect(result.updatedNodes[0]).toBe(taskNode);
    });
  });
});
