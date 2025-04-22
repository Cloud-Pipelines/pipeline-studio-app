import type { ArgumentType } from "@/utils/componentSpec";

export interface ComponentTaskNodeCallbacks {
  setArguments?: (args: Record<string, ArgumentType>) => void;
  onDelete: () => void;
}
