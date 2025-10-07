import type { Node } from "@xyflow/react";
import { useCallback, useMemo } from "react";

import type { NodeType } from "@/nodeManager";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const useNodeManager = () => {
  const { nodeManager } = useComponentSpec();

  // Core NodeManager operations
  const getStableNodeId = useCallback(
    (taskId: string, nodeType: NodeType): string => {
      return nodeManager.getNodeId(taskId, nodeType);
    },
    [nodeManager],
  );

  const getTaskIdFromNodeId = useCallback(
    (nodeId: string): string | undefined => {
      return nodeManager.getTaskId(nodeId);
    },
    [nodeManager],
  );

  const updateTaskId = useCallback(
    (oldTaskId: string, newTaskId: string): void => {
      nodeManager.updateTaskId(oldTaskId, newTaskId);
    },
    [nodeManager],
  );

  const removeNode = useCallback(
    (taskId: string): void => {
      nodeManager.removeNode(taskId);
    },
    [nodeManager],
  );

  const isManaged = useCallback(
    (nodeId: string): boolean => {
      return nodeManager.isManaged(nodeId);
    },
    [nodeManager],
  );

  const getNodeType = useCallback(
    (nodeId: string): NodeType | undefined => {
      return nodeManager.getNodeType(nodeId);
    },
    [nodeManager],
  );

  // Migration utilities
  const migrateNodes = useCallback(
    (
      nodes: Node[],
    ): { updatedNodes: Node[]; migrationMap: Record<string, string> } => {
      return nodeManager.migrateExistingNodes(nodes);
    },
    [nodeManager],
  );

  const migrateNodeToStableId = useCallback(
    (legacyNodeId: string, nodeType: NodeType): string => {
      let taskId: string;

      switch (nodeType) {
        case "task":
          taskId = legacyNodeId.replace(/^task_/, "");
          break;
        case "input":
          taskId = legacyNodeId.replace(/^input_/, "");
          break;
        case "output":
          taskId = legacyNodeId.replace(/^output_/, "");
          break;
        case "taskInput":
          taskId = legacyNodeId.replace(/^taskInput_/, "");
          break;
        case "taskOutput":
          taskId = legacyNodeId.replace(/^taskOutput_/, "");
          break;
        default:
          throw new Error(`Unknown node type: ${nodeType}`);
      }

      return nodeManager.getNodeId(taskId, nodeType);
    },
    [nodeManager],
  );

  // Batch operations
  const batchUpdateTaskIds = useCallback(
    (
      updates: Array<{
        oldTaskId: string;
        newTaskId: string;
        nodeType: NodeType;
      }>,
    ): void => {
      nodeManager.batchUpdateTaskIds(updates);
    },
    [nodeManager],
  );

  // Input/Output specific utilities
  const getInputNodeId = useCallback(
    (inputName: string): string => {
      return nodeManager.getNodeId(inputName, "input");
    },
    [nodeManager],
  );

  const getOutputNodeId = useCallback(
    (outputName: string): string => {
      return nodeManager.getNodeId(outputName, "output");
    },
    [nodeManager],
  );

  const getTaskNodeId = useCallback(
    (taskId: string): string => {
      return nodeManager.getNodeId(taskId, "task");
    },
    [nodeManager],
  );

  const getTaskInputNodeId = useCallback(
    (taskId: string, inputName: string): string => {
      return nodeManager.getTaskHandleNodeId(taskId, inputName, "taskInput");
    },
    [nodeManager],
  );

  const getTaskOutputNodeId = useCallback(
    (taskId: string, outputName: string): string => {
      return nodeManager.getTaskHandleNodeId(taskId, outputName, "taskOutput");
    },
    [nodeManager],
  );

  // Helper to get handle info from node ID
  const getHandleInfo = useCallback(
    (nodeId: string): { taskId: string; handleName: string } | undefined => {
      return nodeManager.getHandleInfo(nodeId);
    },
    [nodeManager],
  );

  // Renaming utilities with automatic sync
  const renameTask = useCallback(
    (oldTaskId: string, newTaskId: string): void => {
      updateTaskId(oldTaskId, newTaskId);
      // NodeManager sync will happen automatically in ComponentSpecProvider
    },
    [updateTaskId],
  );

  const renameInput = useCallback(
    (oldInputName: string, newInputName: string): void => {
      updateTaskId(oldInputName, newInputName); // Inputs use 1:1 mapping
    },
    [updateTaskId],
  );

  const renameOutput = useCallback(
    (oldOutputName: string, newOutputName: string): void => {
      updateTaskId(oldOutputName, newOutputName); // Outputs use 1:1 mapping
    },
    [updateTaskId],
  );

  // Return all utilities as a stable object
  return useMemo(
    () => ({
      // Core operations
      getStableNodeId,
      getTaskIdFromNodeId,
      updateTaskId,
      removeNode,
      isManaged,
      getNodeType,

      // Migration
      migrateNodes,
      migrateNodeToStableId,

      // Batch operations
      batchUpdateTaskIds,

      // Specific node type utilities
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getTaskInputNodeId,
      getTaskOutputNodeId,
      getHandleInfo,

      // Renaming
      renameTask,
      renameInput,
      renameOutput,

      // Direct access to NodeManager for advanced use cases
      nodeManager,
    }),
    [
      getStableNodeId,
      getTaskIdFromNodeId,
      updateTaskId,
      removeNode,
      isManaged,
      getNodeType,
      migrateNodes,
      migrateNodeToStableId,
      batchUpdateTaskIds,
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getTaskInputNodeId,
      getTaskOutputNodeId,
      getHandleInfo,
      renameTask,
      renameInput,
      renameOutput,
      nodeManager,
    ],
  );
};
