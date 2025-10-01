import type {
  NodeAndTaskId,
  NodeCallbacks,
  TaskCallbacks,
} from "@/types/nodes";

// Sync TaskCallbacks with NodeCallbacks by injecting nodeId and taskId
export const convertNodeCallbacksToTaskCallbacks = (
  ids: NodeAndTaskId,
  nodeCallbacks?: NodeCallbacks,
): TaskCallbacks => {
  if (!nodeCallbacks) {
    return createEmptyTaskCallbacks();
  }
  return {
    setArguments: (args) => nodeCallbacks.setArguments?.(ids, args),
    setAnnotations: (annotations) =>
      nodeCallbacks.setAnnotations?.(ids, annotations),
    onDelete: () => nodeCallbacks.onDelete?.(ids),
    onDuplicate: (selected) => nodeCallbacks.onDuplicate?.(ids, selected),
    onUpgrade: (newComponentRef) =>
      nodeCallbacks.onUpgrade?.(ids, newComponentRef),
  };
};

// Sync NodeCallbacks with TaskCallbacks by removing nodeId and taskId
export const convertTaskCallbacksToNodeCallbacks = (
  taskCallbacks: TaskCallbacks,
): NodeCallbacks => {
  return {
    setArguments: (_, args) => taskCallbacks.setArguments?.(args),
    setAnnotations: (_, annotations) =>
      taskCallbacks.setAnnotations?.(annotations),
    onDelete: (_) => taskCallbacks.onDelete?.(),
    onDuplicate: (_, selected) => taskCallbacks.onDuplicate?.(selected),
    onUpgrade: (_, newComponentRef) =>
      taskCallbacks.onUpgrade?.(newComponentRef),
  };
};

// Empty callbacks
export const createEmptyTaskCallbacks = (): TaskCallbacks => ({
  setArguments: () => {},
  setAnnotations: () => {},
  onDelete: () => {},
  onDuplicate: () => {},
  onUpgrade: () => {},
});
