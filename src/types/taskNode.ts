import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

export interface TaskNodeData
  extends Record<string, unknown>,
    TaskNodeCallbacks {
  taskSpec: TaskSpec;
  taskId: string;
  readOnly: boolean;
}

/* Note: Optional callbacks will cause TypeScript to break when applying the callbacks to the Nodes. */
export interface TaskNodeCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  onDelete: () => void;
  onDuplicate: (selected?: boolean) => void;
}
