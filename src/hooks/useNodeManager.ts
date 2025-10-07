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

      // Specific node type utilities
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getTaskInputNodeId,
      getTaskOutputNodeId,
      getHandleInfo,

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
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getTaskInputNodeId,
      getTaskOutputNodeId,
      getHandleInfo,
      nodeManager,
    ],
  );
};
