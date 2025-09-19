import { beforeEach, describe, expect, it } from "vitest";

import { NodeManager } from "./nodeManager";

describe("NodeManager", () => {
  let nodeManager: NodeManager;

  beforeEach(() => {
    nodeManager = new NodeManager();
  });

  describe("stable node ID generation", () => {
    it("should generate consistent node IDs for the same task", () => {
      const nodeId1 = nodeManager.getNodeId("test-task", "task");
      const nodeId2 = nodeManager.getNodeId("test-task", "task");

      expect(nodeId1).toBe(nodeId2);
      expect(nodeId1).toMatch(/^task_/);
    });

    it("should generate different IDs for different tasks", () => {
      const nodeId1 = nodeManager.getNodeId("task-1", "task");
      const nodeId2 = nodeManager.getNodeId("task-2", "task");

      expect(nodeId1).not.toBe(nodeId2);
    });
  });

  describe("task ID updates", () => {
    it("should update task ID while preserving node ID", () => {
      const originalNodeId = nodeManager.getNodeId("old-task", "task");
      nodeManager.updateTaskId("old-task", "new-task");

      const newNodeId = nodeManager.getNodeId("new-task", "task");
      expect(newNodeId).toBe(originalNodeId);

      const taskId = nodeManager.getTaskId(originalNodeId);
      expect(taskId).toBe("new-task");
    });
  });

  describe("migration", () => {
    it("should migrate legacy nodes to stable IDs", () => {
      const legacyNodes = [
        {
          id: "task_legacy-task",
          type: "task",
          data: {},
          position: { x: 0, y: 0 },
        },
        {
          id: "input_legacy-input",
          type: "input",
          data: {},
          position: { x: 0, y: 0 },
        },
      ];

      const { updatedNodes, migrationMap } =
        nodeManager.migrateExistingNodes(legacyNodes);

      expect(updatedNodes).toHaveLength(2);
      expect(updatedNodes[0].id).toMatch(/^task_/);
      expect(updatedNodes[1].id).toMatch(/^input_/);
      expect(updatedNodes[0].id).not.toBe("task_legacy-task");
      expect(updatedNodes[1].id).not.toBe("input_legacy-input");

      expect(migrationMap["task_legacy-task"]).toBe(updatedNodes[0].id);
      expect(migrationMap["input_legacy-input"]).toBe(updatedNodes[1].id);
    });
  });
});
