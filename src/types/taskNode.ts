import type {
  ArgumentType,
  ComponentReference,
  TaskSpec,
} from "@/utils/componentSpec";

import type { Annotations } from "./annotations";

export interface TaskNodeData extends Record<string, unknown> {
  taskSpec?: TaskSpec;
  taskId?: string;
  readOnly?: boolean;
  highlighted?: boolean;
  callbacks?: TaskNodeCallbacks;
  nodeCallbacks: NodeCallbacks;
}

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

export type TaskType = "task" | "input" | "output";

/* Note: Optional callbacks will cause TypeScript to break when applying the callbacks to the Nodes. */
export interface TaskNodeCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  onDelete: () => void;
  onDuplicate: (selected?: boolean) => void;
  onUpgrade: (newComponentRef: ComponentReference) => void;
}

// Dynamic Node Callback types - every callback has a version with the node & task id added to it as an input parameter
export type CallbackWithIds<K extends keyof TaskNodeCallbacks> =
  TaskNodeCallbacks[K] extends (...args: infer A) => infer R
    ? (ids: NodeAndTaskId, ...args: A) => R
    : never;

export type NodeCallbacks = {
  [K in keyof TaskNodeCallbacks]: CallbackWithIds<K>;
};
