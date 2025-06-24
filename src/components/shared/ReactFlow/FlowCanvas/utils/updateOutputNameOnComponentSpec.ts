import type { ComponentSpec } from "@/utils/componentSpec";

/**
 * Renames an output in a component spec, updating both the outputs array
 * and all graph spec references that use the old output name.
 */
export const updateOutputNameOnComponentSpec = (
  componentSpec: ComponentSpec,
  oldName: string,
  newName: string,
): ComponentSpec => {
  const updatedOutputs = componentSpec.outputs?.map((output) =>
    output.name === oldName ? { ...output, name: newName } : output,
  );

  const updatedComponentSpec = {
    ...componentSpec,
    outputs: updatedOutputs,
  };

  // Update graph spec if it exists
  if ("graph" in updatedComponentSpec.implementation && oldName !== newName) {
    const graphSpec = updatedComponentSpec.implementation.graph;
    const updatedOutputValues = { ...graphSpec.outputValues };

    // Remove the old output name and add the new one with the same value
    if (updatedOutputValues[oldName]) {
      updatedOutputValues[newName] = updatedOutputValues[oldName];
      delete updatedOutputValues[oldName];
    }

    updatedComponentSpec.implementation.graph = {
      ...graphSpec,
      outputValues: updatedOutputValues,
    };
  }

  return updatedComponentSpec;
};
