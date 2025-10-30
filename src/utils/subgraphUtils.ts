import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
  TaskSpec,
} from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";
import { ROOT_TASK_ID } from "./constants";
import { pluralize } from "./string";

type NotifyFunction = (
  message: string,
  type: "success" | "warning" | "error" | "info",
) => void;

/**
 * Determines if a task specification represents a subgraph (contains nested graph implementation)
 */
export const isSubgraph = (taskSpec: TaskSpec): boolean => {
  return Boolean(
    taskSpec.componentRef.spec &&
      isGraphImplementation(taskSpec.componentRef.spec.implementation),
  );
};

/**
 * Gets a human-readable description of the subgraph content
 */
export const getSubgraphDescription = (taskSpec: TaskSpec): string => {
  if (!isSubgraph(taskSpec)) {
    return "";
  }

  const subgraphSpec = taskSpec.componentRef.spec;
  if (!subgraphSpec || !isGraphImplementation(subgraphSpec.implementation)) {
    return "Empty subgraph";
  }

  const taskCount = Object.keys(subgraphSpec.implementation.graph.tasks).length;

  if (taskCount === 0) {
    return "Empty subgraph";
  }

  return `${taskCount} ${pluralize(taskCount, "task")}`;
};

/**
 * Navigates to a specific subgraph within a ComponentSpec based on a path
 * @param componentSpec - The root component specification
 * @param subgraphPath - Array of task IDs representing the path to the desired subgraph
 * @param notify - Optional notification function to display warnings
 * @returns ComponentSpec representing the subgraph, or the original spec if path is ["root"]
 */
export const getSubgraphComponentSpec = (
  componentSpec: ComponentSpec,
  subgraphPath: string[],
  notify?: NotifyFunction,
): ComponentSpec => {
  if (subgraphPath.length <= 1 || subgraphPath[0] !== ROOT_TASK_ID) {
    return componentSpec;
  }

  let currentSpec = componentSpec;

  for (let i = 1; i < subgraphPath.length; i++) {
    const taskId = subgraphPath[i];

    if (!isGraphImplementation(currentSpec.implementation)) {
      const message = `Cannot navigate to subgraph: current spec does not have graph implementation at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    const task = currentSpec.implementation.graph.tasks[taskId];
    if (!task) {
      const message = `Cannot navigate to subgraph: task "${taskId}" not found at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    if (!isSubgraph(task)) {
      const message = `Cannot navigate to subgraph: task "${taskId}" is not a subgraph at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    if (!task.componentRef.spec) {
      const message = `Cannot navigate to subgraph: task "${taskId}" has no spec at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    currentSpec = task.componentRef.spec;
  }

  return currentSpec;
};

const detectIONameChanges = (
  oldSpec: ComponentSpec,
  newSpec: ComponentSpec,
): {
  inputChanges: Map<string, string>;
  outputChanges: Map<string, string>;
} => {
  const inputChanges = new Map<string, string>();
  const outputChanges = new Map<string, string>();

  const oldInputs = oldSpec.inputs || [];
  const newInputs = newSpec.inputs || [];

  oldInputs.forEach((oldInput, index) => {
    const newInput = newInputs[index];
    if (
      newInput &&
      oldInput.name !== newInput.name &&
      oldInputs.length === newInputs.length
    ) {
      inputChanges.set(oldInput.name, newInput.name);
    }
  });

  const oldOutputs = oldSpec.outputs || [];
  const newOutputs = newSpec.outputs || [];

  oldOutputs.forEach((oldOutput, index) => {
    const newOutput = newOutputs[index];
    if (
      newOutput &&
      oldOutput.name !== newOutput.name &&
      oldOutputs.length === newOutputs.length
    ) {
      outputChanges.set(oldOutput.name, newOutput.name);
    }
  });

  return { inputChanges, outputChanges };
};

/**
 * Type guard to check if an argument value is a GraphInputArgument
 */
const isGraphInputArgument = (
  argValue: ArgumentType,
): argValue is GraphInputArgument => {
  return (
    argValue !== null &&
    typeof argValue === "object" &&
    "graphInput" in argValue &&
    argValue.graphInput !== null &&
    typeof argValue.graphInput === "object" &&
    "inputName" in argValue.graphInput &&
    typeof argValue.graphInput.inputName === "string"
  );
};

/**
 * Type guard to check if an argument value is a TaskOutputArgument
 */
const isTaskOutputArgument = (
  argValue: ArgumentType,
): argValue is TaskOutputArgument => {
  return (
    argValue !== null &&
    typeof argValue === "object" &&
    "taskOutput" in argValue &&
    argValue.taskOutput !== null &&
    typeof argValue.taskOutput === "object" &&
    "taskId" in argValue.taskOutput &&
    "outputName" in argValue.taskOutput &&
    typeof argValue.taskOutput.taskId === "string" &&
    typeof argValue.taskOutput.outputName === "string"
  );
};

const updateTaskArgumentsForRenamedInputs = (
  taskSpec: TaskSpec,
  inputChanges: Map<string, string>,
): TaskSpec => {
  if (!taskSpec.arguments || inputChanges.size === 0) {
    return taskSpec;
  }

  const updatedArguments: Record<string, ArgumentType> = {};
  let hasChanges = false;

  Object.entries(taskSpec.arguments).forEach(([argName, argValue]) => {
    const newInputName = inputChanges.get(argName);

    if (newInputName) {
      updatedArguments[newInputName] = argValue;
      hasChanges = true;
    } else {
      updatedArguments[argName] = argValue;
    }

    if (isGraphInputArgument(argValue)) {
      const referencedInputName = argValue.graphInput.inputName;
      const newReferencedInputName = inputChanges.get(referencedInputName);

      if (newReferencedInputName) {
        updatedArguments[newInputName || argName] = {
          ...argValue,
          graphInput: {
            ...argValue.graphInput,
            inputName: newReferencedInputName,
          },
        };
        hasChanges = true;
      }
    }
  });

  return hasChanges ? { ...taskSpec, arguments: updatedArguments } : taskSpec;
};

/**
 * Updates all tasks in a graph that reference renamed outputs from a specific subgraph task.
 * When a subgraph's output is renamed, any tasks in the parent graph that reference
 * that output need to be updated to use the new output name.
 */
const updateGraphTasksForRenamedOutputs = (
  graphSpec: GraphSpec,
  subgraphTaskId: string,
  outputChanges: Map<string, string>,
): GraphSpec => {
  if (outputChanges.size === 0) {
    return graphSpec;
  }

  const updatedTasks: Record<string, TaskSpec> = {};

  Object.entries(graphSpec.tasks).forEach(
    ([taskId, task]: [string, TaskSpec]) => {
      if (!task.arguments) {
        updatedTasks[taskId] = task;
        return;
      }

      const updatedArguments: Record<string, ArgumentType> = {};
      let hasTaskChanges = false;

      Object.entries(task.arguments).forEach(([argName, argValue]) => {
        const needsUpdate =
          isTaskOutputArgument(argValue) &&
          argValue.taskOutput.taskId === subgraphTaskId &&
          outputChanges.has(argValue.taskOutput.outputName);

        if (needsUpdate) {
          const newOutputName = outputChanges.get(
            argValue.taskOutput.outputName,
          )!;
          updatedArguments[argName] = {
            ...argValue,
            taskOutput: {
              ...argValue.taskOutput,
              outputName: newOutputName,
            },
          };
          hasTaskChanges = true;
        } else {
          updatedArguments[argName] = argValue;
        }
      });

      updatedTasks[taskId] = hasTaskChanges
        ? { ...task, arguments: updatedArguments }
        : task;
    },
  );

  const hasAnyChanges = Object.keys(updatedTasks).some(
    (taskId) => updatedTasks[taskId] !== graphSpec.tasks[taskId],
  );

  return hasAnyChanges ? { ...graphSpec, tasks: updatedTasks } : graphSpec;
};

/**
 * Updates a nested subgraph specification within the root component spec.
 * This function recursively navigates the subgraph path and replaces the
 * target subgraph's spec with the updated version, maintaining immutability
 * throughout the component tree.
 *
 * @param currentSpec - The component specification to update (root spec on initial call)
 * @param subgraphPath - Array of task IDs representing the path to the target subgraph (e.g., ["root", "task1", "task2"])
 * @param updatedSubgraphSpec - The new component spec for the target subgraph
 * @returns A new ComponentSpec with the subgraph updated
 *
 * @example
 * const newRootSpec = updateSubgraphSpec(
 *   rootSpec,
 *   ["root", "pipeline-task", "nested-task"],
 *   modifiedSubgraphSpec
 * );
 */
export const updateSubgraphSpec = (
  currentSpec: ComponentSpec,
  subgraphPath: string[],
  updatedSubgraphSpec: ComponentSpec,
): ComponentSpec => {
  const path =
    subgraphPath.length > 0 && subgraphPath[0] === ROOT_TASK_ID
      ? subgraphPath.slice(1)
      : subgraphPath;

  if (path.length === 0) {
    return updatedSubgraphSpec;
  }

  if (!isGraphImplementation(currentSpec.implementation)) {
    console.warn(
      `Cannot update subgraph: current spec does not have graph implementation`,
    );
    return currentSpec;
  }

  const taskId = path[0];
  const targetTask = currentSpec.implementation.graph.tasks[taskId];

  if (!targetTask) {
    console.warn(`Cannot update subgraph: task "${taskId}" not found`);
    return currentSpec;
  }

  if (!isSubgraph(targetTask)) {
    console.warn(`Cannot update subgraph: task "${taskId}" is not a subgraph`);
    return currentSpec;
  }

  if (!targetTask.componentRef.spec) {
    console.warn(`Cannot update subgraph: task "${taskId}" has no spec`);
    return currentSpec;
  }

  const oldSubgraphSpec = targetTask.componentRef.spec;
  const updatedNestedSpec = updateSubgraphSpec(
    oldSubgraphSpec,
    path.slice(1),
    updatedSubgraphSpec,
  );

  const { inputChanges, outputChanges } = detectIONameChanges(
    oldSubgraphSpec,
    updatedNestedSpec,
  );

  let updatedTargetTask = targetTask;
  if (inputChanges.size > 0) {
    updatedTargetTask = updateTaskArgumentsForRenamedInputs(
      targetTask,
      inputChanges,
    );
  }

  updatedTargetTask = {
    ...updatedTargetTask,
    componentRef: {
      ...updatedTargetTask.componentRef,
      spec: updatedNestedSpec,
    },
  };

  let updatedGraph = currentSpec.implementation.graph;
  if (outputChanges.size > 0) {
    updatedGraph = updateGraphTasksForRenamedOutputs(
      updatedGraph,
      taskId,
      outputChanges,
    );
  }

  return {
    ...currentSpec,
    implementation: {
      ...currentSpec.implementation,
      graph: {
        ...updatedGraph,
        tasks: {
          ...updatedGraph.tasks,
          [taskId]: updatedTargetTask,
        },
      },
    },
  };
};
