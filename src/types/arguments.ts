import type { ArgumentType, InputSpec } from "@/utils/componentSpec";

/**
 * Argument input to the Argument Editor.
 */

export type ArgumentInput = {
  key: string;
  value: ArgumentType;
  initialValue: ArgumentType;
  inputSpec: InputSpec;
  isRemoved?: boolean;
  isPrivate?: boolean;
};
