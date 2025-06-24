import type { ComponentSpec, GraphSpec } from "@/utils/componentSpec";

/**
 * Checks if an input is connected to any required fields in task nodes
 * @param inputName - The name of the input to check
 * @param componentSpec - The component specification containing the graph
 * @returns An object with isConnectedToRequired (boolean) and connectedFields (array of field names)
 */
export const checkInputConnectionToRequiredFields = (
  inputName: string,
  componentSpec: ComponentSpec,
): { isConnectedToRequired: boolean; connectedFields: string[] } => {
  if (!("graph" in componentSpec.implementation)) {
    return { isConnectedToRequired: false, connectedFields: [] };
  }

  const graphSpec: GraphSpec = componentSpec.implementation.graph;
  const connectedFields: string[] = [];
  let isConnectedToRequired = false;

  // Iterate through all tasks in the graph
  Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
    const taskComponentSpec = taskSpec.componentRef.spec;

    // Check each input of the task
    taskComponentSpec?.inputs?.forEach((taskInput) => {
      const argument = taskSpec.arguments?.[taskInput.name];

      // Check if this argument is connected to our input
      if (
        argument &&
        typeof argument === "object" &&
        "graphInput" in argument &&
        argument.graphInput.inputName === inputName
      ) {
        connectedFields.push(`${taskId}.${taskInput.name}`);

        // Check if this field is required (not optional and no default)
        if (!taskInput.optional && taskInput.default === undefined) {
          isConnectedToRequired = true;
        }
      }
    });
  });

  return { isConnectedToRequired, connectedFields };
};
