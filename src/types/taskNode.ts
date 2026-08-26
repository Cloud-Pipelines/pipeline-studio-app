import type {
  ArgumentType,
  ComponentReference,
  HydratedComponentReference,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";

import type { Annotations } from "./annotations";

export interface TaskNodeData extends Record<string, unknown> {
  taskSpec?: TaskSpec;
  taskId?: string;
  readOnly?: boolean;
  isGhost?: boolean;
  connectable?: boolean;
  highlighted?: boolean;
  callbacks?: TaskNodeCallbacks;
  nodeCallbacks?: NodeCallbacks;
}

type NodeAndTaskId = {
  taskId: string;
  nodeId: string;
};

export type TaskType = "task" | "input" | "output";

interface TaskNodeContextState {
  selected: boolean;
  highlighted: boolean;
  readOnly: boolean;
  disabled: boolean;
  connectable: boolean;
  status?: string;
  isCustomComponent: boolean;
  isCollapsed: boolean;
  dimensions: TaskNodeDimensions;
}

interface TaskNodeContextCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  setCacheStaleness: (cacheStaleness: string | undefined) => void;
  setCollapsed: (collapsed: boolean) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpgrade?: () => void;
  onSelect?: () => void;
}

export interface TaskNodeContextType {
  componentRef?: HydratedComponentReference;
  taskSpec?: TaskSpec;
  taskId?: string;
  nodeId: string;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  name: string;
  displayName: string;
  state: TaskNodeContextState;
  callbacks: TaskNodeContextCallbacks;
}

/* Note: Optional callbacks will cause TypeScript to break when applying the callbacks to the Nodes. */
export interface TaskNodeCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  setCacheStaleness: (cacheStaleness: string | undefined) => void;
  onDelete: () => void;
  onDuplicate: (selected?: boolean) => void;
  onUpgrade: (newComponentRef: ComponentReference) => void;
  onSelect: () => void;
}

function noop() {}

export const DEFAULT_TASK_NODE_CALLBACKS: TaskNodeCallbacks = {
  setArguments: noop,
  setAnnotations: noop,
  onDelete: noop,
  onDuplicate: noop,
  onUpgrade: noop,
  setCacheStaleness: noop,
  onSelect: noop,
};

// Dynamic Node Callback types - every callback has a version with the node & task id added to it as an input parameter
type CallbackWithIds<K extends keyof TaskNodeCallbacks> =
  TaskNodeCallbacks[K] extends (...args: infer A) => infer R
    ? (ids: NodeAndTaskId, ...args: A) => R
    : never;

export type NodeCallbacks = {
  [K in keyof TaskNodeCallbacks]: CallbackWithIds<K>;
};

type TaskNodeDimensions = { w: number; h: number | undefined };
