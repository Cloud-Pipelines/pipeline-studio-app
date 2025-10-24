import { useCallback, useMemo } from "react";

import type { HandleInfo, NodeType } from "@/nodeManager";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const useNodeManager = () => {
  const { nodeManager } = useComponentSpec();

  // Get node ID utilities
  const getNodeId = useCallback(
    (refId: string, type: NodeType): string => {
      return nodeManager.getNodeId(refId, type);
    },
    [nodeManager],
  );

  const getHandleNodeId = useCallback(
    (
      refId: string,
      handleName: string,
      handleType: "handle-in" | "handle-out",
    ): string => {
      return nodeManager.getHandleNodeId(refId, handleName, handleType);
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
    (inputId: string): string => {
      return nodeManager.getNodeId(inputId, "input");
    },
    [nodeManager],
  );

  const getOutputNodeId = useCallback(
    (outputId: string): string => {
      return nodeManager.getNodeId(outputId, "output");
    },
    [nodeManager],
  );

  const getInputHandleNodeId = useCallback(
    (refId: string, inputName: string): string => {
      return nodeManager.getHandleNodeId(refId, inputName, "handle-in");
    },
    [nodeManager],
  );

  const getOutputHandleNodeId = useCallback(
    (refId: string, outputName: string): string => {
      return nodeManager.getHandleNodeId(refId, outputName, "handle-out");
    },
    [nodeManager],
  );

  // Get task ID from node ID
  const getRefId = useCallback(
    (nodeId: string): string | undefined => {
      return nodeManager.getRefId(nodeId);
    },
    [nodeManager],
  );

  // Core NodeManager operations
  const updateRefId = useCallback(
    (oldRefId: string, newRefId: string): void => {
      nodeManager.updateRefId(oldRefId, newRefId);
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
      getHandleInfo,
      getNodeType,
      getRefId,
      updateRefId,
      // Specific getters
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getInputHandleNodeId,
      getOutputHandleNodeId,
      // NodeManager instance
      nodeManager,
    }),
    [
      getNodeId,
      getHandleNodeId,
      getHandleInfo,
      getNodeType,
      getRefId,
      updateRefId,
      getInputNodeId,
      getOutputNodeId,
      getTaskNodeId,
      getInputHandleNodeId,
      getOutputHandleNodeId,
      nodeManager,
    ],
  );
};
