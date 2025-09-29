import type { NodeManager, NodeType } from "@/nodeManager";

// DEPRECATED: Legacy functions - use NodeManager instead
export const taskIdToNodeId = (taskId: string): string => `task_${taskId}`; // Legacy
export const inputNameToNodeId = (inputName: string): string =>
  `input_${inputName}`; // Legacy
export const outputNameToNodeId = (outputName: string): string =>
  `output_${outputName}`; // Legacy

// RENAMED: For backwards compatibility and clarity
export const inputNameToInputId = (inputName: string): string => inputName; // 1:1 mapping
export const outputNameToOutputId = (outputName: string): string => outputName; // 1:1 mapping
export const inputIdToInputName = (inputId: string): string => inputId; // 1:1 mapping
export const outputIdToOutputName = (outputId: string): string => outputId; // 1:1 mapping

// LEGACY: Keep for backwards compatibility
export const nodeIdToTaskId = (nodeId: string): string => {
  return nodeId.replace(/^task_/, "");
};

export const nodeIdToInputName = (nodeId: string): string => {
  return nodeId.replace(/^input_/, "");
};

export const nodeIdToOutputName = (nodeId: string): string => {
  return nodeId.replace(/^output_/, "");
};

// NEW: NodeManager-aware functions
export const getTaskIdFromNodeId = (
  nodeId: string,
  nodeManager: NodeManager,
): string | undefined => {
  return nodeManager.getTaskId(nodeId);
};

export const getStableNodeId = (
  taskId: string,
  nodeType: NodeType,
  nodeManager: NodeManager,
): string => {
  return nodeManager.getNodeId(taskId, nodeType);
};
