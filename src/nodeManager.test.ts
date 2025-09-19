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
});
