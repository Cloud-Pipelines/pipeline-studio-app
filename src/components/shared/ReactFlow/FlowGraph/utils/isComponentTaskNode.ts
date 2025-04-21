import type { Node } from "@xyflow/react";

import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

export const isComponentTaskNode = (
  node: Node,
): node is Node<ComponentTaskNodeProps> =>
  node.type === "task" &&
  node.data !== undefined &&
  "taskSpec" in node.data &&
  "taskId" in node.data;

export interface ComponentTaskNodeCallbacks {
  setArguments?: (args: Record<string, ArgumentType>) => void;
  onDelete: () => void;
}

export interface ComponentTaskNodeProps
  extends Record<string, unknown>,
    ComponentTaskNodeCallbacks {
  taskSpec: TaskSpec;
  taskId: string;
}
