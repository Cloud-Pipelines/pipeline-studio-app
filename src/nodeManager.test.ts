import { beforeEach, describe, expect, it } from "vitest";

import { NodeManager } from "./nodeManager";
import type { ComponentSpec } from "./utils/componentSpec";

describe("NodeManager", () => {
  let nodeManager: NodeManager;

  beforeEach(() => {
    nodeManager = new NodeManager();
  });

  describe("stable node ID generation", () => {
    it("should generate consistent node IDs for the same reference", () => {
      const nodeId1 = nodeManager.getNodeId("test-task", "task");
      const nodeId2 = nodeManager.getNodeId("test-task", "task");

      expect(nodeId1).toBe(nodeId2);
      expect(nodeId1).toMatch(/^task_/);
    });

    it("should generate different IDs for different references", () => {
      const nodeId1 = nodeManager.getNodeId("task-1", "task");
      const nodeId2 = nodeManager.getNodeId("task-2", "task");

      expect(nodeId1).not.toBe(nodeId2);
    });

    it("should generate different IDs for same reference but different node types", () => {
      const taskNodeId = nodeManager.getNodeId("test", "task");
      const inputNodeId = nodeManager.getNodeId("test", "input");
      const outputNodeId = nodeManager.getNodeId("test", "output");

      expect(taskNodeId).not.toBe(inputNodeId);
      expect(taskNodeId).not.toBe(outputNodeId);
      expect(inputNodeId).not.toBe(outputNodeId);
    });

    it("should use correct prefixes for different node types", () => {
      const taskId = nodeManager.getNodeId("test", "task");
      const inputId = nodeManager.getNodeId("test", "input");
      const outputId = nodeManager.getNodeId("test", "output");

      expect(taskId).toMatch(/^task_/);
      expect(inputId).toMatch(/^input_/);
      expect(outputId).toMatch(/^output_/);
    });
  });

  describe("handle node ID generation", () => {
    it("should generate consistent handle node IDs", () => {
      const handleId1 = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      const handleId2 = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );

      expect(handleId1).toBe(handleId2);
      expect(handleId1).toMatch(/^handle-in_/);
    });

    it("should generate different IDs for different handles", () => {
      const inputHandle = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      const outputHandle = nodeManager.getHandleNodeId(
        "task1",
        "output1",
        "handle-out",
      );

      expect(inputHandle).not.toBe(outputHandle);
      expect(inputHandle).toMatch(/^handle-in_/);
      expect(outputHandle).toMatch(/^handle-out_/);
    });

    it("should generate different IDs for same handle name on different parents", () => {
      const handle1 = nodeManager.getHandleNodeId("task1", "data", "handle-in");
      const handle2 = nodeManager.getHandleNodeId("task2", "data", "handle-in");

      expect(handle1).not.toBe(handle2);
    });

    it("should generate different IDs for different handle types on same parent", () => {
      const inputHandle = nodeManager.getHandleNodeId(
        "task1",
        "data",
        "handle-in",
      );
      const outputHandle = nodeManager.getHandleNodeId(
        "task1",
        "data",
        "handle-out",
      );

      expect(inputHandle).not.toBe(outputHandle);
    });
  });

  describe("handle info retrieval", () => {
    it("should return correct handle info for valid handle node ID", () => {
      const handleNodeId = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      const handleInfo = nodeManager.getHandleInfo(handleNodeId);

      expect(handleInfo).toEqual({
        parentRefId: "task1",
        handleName: "input1",
        handleType: "handle-in",
      });
    });

    it("should return undefined for non-handle node ID", () => {
      const taskNodeId = nodeManager.getNodeId("task1", "task");
      const handleInfo = nodeManager.getHandleInfo(taskNodeId);

      expect(handleInfo).toBeUndefined();
    });

    it("should return undefined for invalid node ID", () => {
      const handleInfo = nodeManager.getHandleInfo("invalid-id");
      expect(handleInfo).toBeUndefined();
    });
  });

  describe("node type retrieval", () => {
    it("should return correct node type for all node types", () => {
      const taskId = nodeManager.getNodeId("test", "task");
      const inputId = nodeManager.getNodeId("test", "input");
      const outputId = nodeManager.getNodeId("test", "output");
      const inputHandleId = nodeManager.getHandleNodeId(
        "test",
        "handle",
        "handle-in",
      );
      const outputHandleId = nodeManager.getHandleNodeId(
        "test",
        "handle",
        "handle-out",
      );

      expect(nodeManager.getNodeType(taskId)).toBe("task");
      expect(nodeManager.getNodeType(inputId)).toBe("input");
      expect(nodeManager.getNodeType(outputId)).toBe("output");
      expect(nodeManager.getNodeType(inputHandleId)).toBe("handle-in");
      expect(nodeManager.getNodeType(outputHandleId)).toBe("handle-out");
    });

    it("should return undefined for invalid node ID", () => {
      expect(nodeManager.getNodeType("invalid-id")).toBeUndefined();
    });
  });

  describe("ref ID retrieval", () => {
    it("should return correct ref ID for regular nodes", () => {
      const nodeId = nodeManager.getNodeId("test-task", "task");
      expect(nodeManager.getRefId(nodeId)).toBe("test-task");
    });

    it("should return handle-specific ref ID for handle nodes", () => {
      const handleNodeId = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      expect(nodeManager.getRefId(handleNodeId)).toBe("handle-in:input1");
    });

    it("should return undefined for invalid node ID", () => {
      expect(nodeManager.getRefId("invalid-id")).toBeUndefined();
    });
  });

  describe("ref ID updates", () => {
    it("should update ref ID while preserving node ID", () => {
      const originalNodeId = nodeManager.getNodeId("old-task", "task");
      nodeManager.updateRefId("old-task", "new-task");

      const newNodeId = nodeManager.getNodeId("new-task", "task");
      expect(newNodeId).toBe(originalNodeId);

      const refId = nodeManager.getRefId(originalNodeId);
      expect(refId).toBe("new-task");
    });

    it("should update only specified node type when provided", () => {
      const taskNodeId = nodeManager.getNodeId("test", "task");
      const inputNodeId = nodeManager.getNodeId("test", "input");

      nodeManager.updateRefId("test", "new-test", "task");

      expect(nodeManager.getRefId(taskNodeId)).toBe("new-test");
      expect(nodeManager.getRefId(inputNodeId)).toBe("test");
    });

    it("should update all node types when no type specified", () => {
      const taskNodeId = nodeManager.getNodeId("test", "task");
      const inputNodeId = nodeManager.getNodeId("test", "input");

      nodeManager.updateRefId("test", "new-test");

      expect(nodeManager.getRefId(taskNodeId)).toBe("new-test");
      expect(nodeManager.getRefId(inputNodeId)).toBe("new-test");
    });

    it("should update parent ref ID for handles", () => {
      const handleNodeId = nodeManager.getHandleNodeId(
        "old-task",
        "input1",
        "handle-in",
      );
      nodeManager.updateRefId("old-task", "new-task");

      const handleInfo = nodeManager.getHandleInfo(handleNodeId);
      expect(handleInfo?.parentRefId).toBe("new-task");
    });

    it("should update handles when their parent node type is updated", () => {
      const handleNodeId = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      const originalHandleInfo = nodeManager.getHandleInfo(handleNodeId);

      nodeManager.updateRefId("task1", "new-task", "task");

      const updatedHandleInfo = nodeManager.getHandleInfo(handleNodeId);
      expect(updatedHandleInfo).toEqual({
        ...originalHandleInfo,
        parentRefId: "new-task",
      });
    });

    it("should not update handles when unrelated node types are updated", () => {
      const handleNodeId = nodeManager.getHandleNodeId(
        "task1",
        "input1",
        "handle-in",
      );
      const originalHandleInfo = nodeManager.getHandleInfo(handleNodeId);

      nodeManager.updateRefId("some-input", "new-input", "input");

      const updatedHandleInfo = nodeManager.getHandleInfo(handleNodeId);
      expect(updatedHandleInfo).toEqual(originalHandleInfo);
    });
  });

  describe("syncWithComponentSpec", () => {
    it("should sync with graph implementation component spec", () => {
      const componentSpec: ComponentSpec = {
        name: "test-component",
        inputs: [
          { name: "input1", type: "String", annotations: {} },
          { name: "input2", type: "Number", annotations: {} },
        ],
        outputs: [{ name: "output1", type: "String", annotations: {} }],
        implementation: {
          graph: {
            tasks: {
              task1: {
                componentRef: {
                  name: "sub-component",
                  spec: {
                    name: "sub-component",
                    inputs: [{ name: "data", type: "String", annotations: {} }],
                    outputs: [
                      { name: "result", type: "String", annotations: {} },
                    ],
                    implementation: {
                      container: { image: "sub-component-image" },
                    },
                  },
                },
                arguments: {},
                annotations: {},
              },
            },
          },
        },
      };

      nodeManager.syncWithComponentSpec(componentSpec);

      const taskNodeId = nodeManager.getNodeId("task1", "task");
      expect(taskNodeId).toBeDefined();

      const input1NodeId = nodeManager.getNodeId("input1", "input");
      const input2NodeId = nodeManager.getNodeId("input2", "input");
      expect(input1NodeId).toBeDefined();
      expect(input2NodeId).toBeDefined();

      const output1NodeId = nodeManager.getNodeId("output1", "output");
      expect(output1NodeId).toBeDefined();

      const taskInputHandleId = nodeManager.getHandleNodeId(
        "task1",
        "data",
        "handle-in",
      );
      const taskOutputHandleId = nodeManager.getHandleNodeId(
        "task1",
        "result",
        "handle-out",
      );
      expect(taskInputHandleId).toBeDefined();
      expect(taskOutputHandleId).toBeDefined();

      const inputHandleId = nodeManager.getHandleNodeId(
        "input1",
        "input1",
        "handle-out",
      );
      const outputHandleId = nodeManager.getHandleNodeId(
        "output1",
        "output1",
        "handle-in",
      );
      expect(inputHandleId).toBeDefined();
      expect(outputHandleId).toBeDefined();
    });

    it("should sync with container implementation component spec", () => {
      const componentSpec: ComponentSpec = {
        name: "test-component",
        inputs: [{ name: "input1", type: "String", annotations: {} }],
        outputs: [{ name: "output1", type: "String", annotations: {} }],
        implementation: {
          container: { image: "test-image" },
        },
      };

      nodeManager.syncWithComponentSpec(componentSpec);

      const input1NodeId = nodeManager.getNodeId("input1", "input");
      const output1NodeId = nodeManager.getNodeId("output1", "output");
      expect(input1NodeId).toBeDefined();
      expect(output1NodeId).toBeDefined();

      const inputHandleId = nodeManager.getHandleNodeId(
        "input1",
        "input1",
        "handle-out",
      );
      const outputHandleId = nodeManager.getHandleNodeId(
        "output1",
        "output1",
        "handle-in",
      );
      expect(inputHandleId).toBeDefined();
      expect(outputHandleId).toBeDefined();
    });

    it("should preserve existing nodes that are still valid", () => {
      const componentSpec: ComponentSpec = {
        name: "test-component",
        inputs: [{ name: "input1", type: "String", annotations: {} }],
        outputs: [],
        implementation: {
          graph: {
            tasks: {
              task1: {
                componentRef: {
                  name: "sub-component",
                  spec: {
                    name: "sub-component",
                    inputs: [{ name: "data", type: "String", annotations: {} }],
                    outputs: [],
                    implementation: {
                      container: { image: "sub-component-image" },
                    },
                  },
                },
                arguments: {},
                annotations: {},
              },
            },
          },
        },
      };

      nodeManager.syncWithComponentSpec(componentSpec);
      const originalTaskNodeId = nodeManager.getNodeId("task1", "task");
      const originalInputNodeId = nodeManager.getNodeId("input1", "input");

      nodeManager.syncWithComponentSpec(componentSpec);
      const newTaskNodeId = nodeManager.getNodeId("task1", "task");
      const newInputNodeId = nodeManager.getNodeId("input1", "input");

      expect(newTaskNodeId).toBe(originalTaskNodeId);
      expect(newInputNodeId).toBe(originalInputNodeId);
    });

    it("should handle component spec with tasks but no task inputs/outputs", () => {
      const componentSpec: ComponentSpec = {
        name: "test-component",
        inputs: [],
        outputs: [],
        implementation: {
          graph: {
            tasks: {
              task1: {
                componentRef: {
                  name: "minimal-task",
                  spec: {
                    name: "minimal-task",
                    implementation: {
                      container: { image: "minimal-image" },
                    },
                  },
                },
                arguments: {},
                annotations: {},
              },
            },
          },
        },
      };

      expect(() => {
        nodeManager.syncWithComponentSpec(componentSpec);
      }).not.toThrow();

      const taskNodeId = nodeManager.getNodeId("task1", "task");
      expect(taskNodeId).toBeDefined();
    });
  });
});
