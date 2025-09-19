import type {
  ArgumentType,
  ComponentReference,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import type { Annotations } from "./annotations";

export interface NodeData extends Record<string, unknown> {
  readOnly: boolean;
  connectable?: boolean;
  callbacks?: NodeCallbacks;
}

export interface TaskNodeData extends Record<string, unknown> {
  taskSpec: TaskSpec;
  taskId: string;
  readOnly: boolean;
  isGhost: boolean;
  connectable: boolean;
  highlighted: boolean;
  callbacks: TaskCallbacks;
}

export interface IONodeData extends Record<string, unknown> {
  spec: InputSpec | OutputSpec;
  readOnly: boolean;
}

export interface HintNodeData extends Record<string, unknown> {
  key: string;
  hint: string;
  side: "left" | "right";
}

export type TaskType = "task" | "input" | "output";

export type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

/* Note: Optional callbacks will cause TypeScript to break when applying the callbacks to the Nodes. */
export interface TaskCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  onDelete: () => void;
  onDuplicate: (selected?: boolean) => void;
  onUpgrade: (newComponentRef: ComponentReference) => void;
}

// Dynamic Node Callback types - every callback has a version with the node & task id added to it as an input parameter
type CallbackWithIds<K extends keyof TaskCallbacks> = TaskCallbacks[K] extends (
  ...args: infer A
) => infer R
  ? (ids: NodeAndTaskId, ...args: A) => R
  : never;

export type NodeCallbacks = {
  [K in keyof TaskCallbacks]: CallbackWithIds<K>;
};

export type TaskNodeDimensions = { w: number; h: number | undefined };
