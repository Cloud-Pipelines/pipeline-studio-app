import type { ArgumentType } from "@/utils/componentSpec";

/* Note: Optional callbacks will cause TypeScript to break when applying the callbacks to the Nodes. */
export interface TaskNodeCallbacks {
  setArguments: (args: Record<string, ArgumentType>) => void;
  onDelete: () => void;
  onDuplicate: (selected?: boolean) => void;
}
