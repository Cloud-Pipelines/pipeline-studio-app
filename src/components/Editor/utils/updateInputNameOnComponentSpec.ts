import {
  type ArgumentType,
  type ComponentSpec,
  type GraphInputArgument,
  type GraphSpec,
  isGraphImplementation,
  type TaskSpec,
} from "@/utils/componentSpec";

/**
 * Type guard to check if argument is a GraphInputArgument
 */
const isGraphInputArgument = (
  argument: ArgumentType,
): argument is GraphInputArgument => {
  return typeof argument !== "string" && "graphInput" in argument;
};

/**
 * Updates a single task's arguments to use the new input name
 */
const updateTaskArguments = (
  task: TaskSpec,
  oldName: string,
  newName: string,
): TaskSpec => {
  if (!task.arguments) return task;

  const updatedArguments = { ...task.arguments };

  Object.entries(updatedArguments).forEach(([inputName, argument]) => {
    if (
      isGraphInputArgument(argument) &&
      argument.graphInput.inputName === oldName
    ) {
      updatedArguments[inputName] = {
        ...argument,
        graphInput: {
          ...argument.graphInput,
          inputName: newName,
        },
      };
    }
  });

  return { ...task, arguments: updatedArguments };
};

/**
 * Updates all tasks in a graph spec to use the new input name
 */
const updateGraphTasks = (
  graphSpec: GraphSpec,
  oldName: string,
  newName: string,
): GraphSpec => {
  const updatedTasks = { ...graphSpec.tasks };

  Object.keys(updatedTasks).forEach((taskId) => {
    updatedTasks[taskId] = updateTaskArguments(
      updatedTasks[taskId],
      oldName,
      newName,
    );
  });

  return { ...graphSpec, tasks: updatedTasks };
};

/**
 * Renames an input in a component spec, updating both the inputs array
 * and all graph spec references that use the old input name.
 */
export const updateInputNameOnComponentSpec = (
  componentSpec: ComponentSpec,
  oldName: string,
  newName: string,
): ComponentSpec => {
  const updatedInputs = componentSpec.inputs?.map((input) =>
    input.name === oldName ? { ...input, name: newName } : input,
  );

  const updatedComponentSpec = {
    ...componentSpec,
    inputs: updatedInputs,
  };

  // Update graph spec if it exists
  if (isGraphImplementation(updatedComponentSpec.implementation)) {
    const graphSpec = updatedComponentSpec.implementation.graph;
    const updatedGraphSpec = updateGraphTasks(graphSpec, oldName, newName);
    updatedComponentSpec.implementation.graph = updatedGraphSpec;
  }

  return updatedComponentSpec;
};
