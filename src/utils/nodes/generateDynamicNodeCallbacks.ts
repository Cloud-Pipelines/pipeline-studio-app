import type { NodeCallbacks, TaskNodeCallbacks } from "@/types/taskNode";
import { DEFAULT_TASK_NODE_CALLBACKS } from "@/types/taskNode";

import { nodeIdToTaskId } from "./nodeIdUtils";

// Utility function that adds the taskId and nodeId to the callbacks as the first argument
export const generateDynamicNodeCallbacks = (
  nodeId: string,
  nodeCallbacks?: NodeCallbacks,
): TaskNodeCallbacks => {
  if (!nodeCallbacks) {
    return DEFAULT_TASK_NODE_CALLBACKS;
  }

  const ids = { taskId: nodeIdToTaskId(nodeId), nodeId };

  return {
    setArguments: (args) => nodeCallbacks.setArguments(ids, args),
    setAnnotations: (annotations) =>
      nodeCallbacks.setAnnotations(ids, annotations),
    setCacheStaleness: (cacheStaleness) =>
      nodeCallbacks.setCacheStaleness(ids, cacheStaleness),
    onDelete: () => nodeCallbacks.onDelete(ids),
    onDuplicate: (selected) => nodeCallbacks.onDuplicate(ids, selected),
    onUpgrade: (newComponentRef) =>
      nodeCallbacks.onUpgrade(ids, newComponentRef),
    onSelect: () => nodeCallbacks.onSelect(ids),
  };
};
