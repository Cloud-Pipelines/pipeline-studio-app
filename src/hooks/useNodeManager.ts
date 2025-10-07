import { useCallback, useMemo } from "react";

import type { HandleInfo, NodeType } from "@/nodeManager";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const useNodeManager = () => {
  const { nodeManager } = useComponentSpec();

  // Get node ID utilities
  const getNodeId = useCallback(
    (name: string, type: "input" | "output" | "task"): string => {
      return nodeManager.getNodeId(name, type);
    },
    [nodeManager],
  );

  const getHandleNodeId = useCallback(
    (
      taskId: string,
      handleName: string,
      handleType: "inputHandle" | "outputHandle",
    ): string => {
      return nodeManager.getHandleNodeId(taskId, handleName, handleType);
    },
    [nodeManager],
  );

  const getTaskNodeId = useCallback(
    (taskId: string): string => {
      return nodeManager.getNodeId(taskId, "task");
    },
    [nodeManager],
  );

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

  const getInputHandleNodeId = useCallback(
    (taskId: string, inputName: string): string => {
      return nodeManager.getHandleNodeId(taskId, inputName, "inputHandle");
    },
    [nodeManager],
  );

  const getOutputHandleNodeId = useCallback(
    (taskId: string, outputName: string): string => {
      return nodeManager.getHandleNodeId(taskId, outputName, "outputHandle");
    },
    [nodeManager],
  );

  // Get task ID from node ID
  const getTaskId = useCallback(
    (nodeId: string): string | undefined => {
      return nodeManager.getTaskId(nodeId);
    },
    [nodeManager],
  );

  // Core NodeManager operations
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

  const getNodeType = useCallback(
    (nodeId: string): NodeType | undefined => {
      return nodeManager.getNodeType(nodeId);
    },
    [nodeManager],
  );

  const getHandleInfo = useCallback(
    (nodeId: string): HandleInfo | undefined => {
      return nodeManager.getHandleInfo(nodeId);
    },
    [nodeManager],
  );

  return useMemo(
    () => ({
      // Core operations
      getNodeId,
      getHandleNodeId,
      getTaskId,
      updateTaskId,
      removeNode,
      getNodeType,
      // Specific getters
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getInputHandleNodeId,
      getOutputHandleNodeId,
      getHandleInfo,
      // NodeManager instance
      nodeManager,
    }),
    [
      getNodeId,
      getHandleNodeId,
      getTaskId,
      updateTaskId,
      removeNode,
      getNodeType,
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getInputHandleNodeId,
      getOutputHandleNodeId,
      getHandleInfo,
      nodeManager,
    ],
  );
};
