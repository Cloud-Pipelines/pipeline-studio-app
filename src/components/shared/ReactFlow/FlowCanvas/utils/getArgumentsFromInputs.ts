import type { ComponentSpec } from "@/utils/componentSpec";

/**
 * Generates arguments object from component spec inputs that have values
 * @param componentSpec - The component specification containing inputs
 * @returns Object with input names as keys and their values as values
 */
export const getArgumentsFromInputs = (
  componentSpec: ComponentSpec,
): Record<string, string> => {
  const args: Record<string, string> = {};

  if (!componentSpec.inputs) {
    return args;
  }

  for (const input of componentSpec.inputs) {
    if (input.value !== undefined && input.value !== null) {
      args[input.name] = input.value;
    }
  }

  return args;
};
