import type {
  ArgumentType,
  ComponentReference,
  GraphSpec,
  InputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { deepClone } from "@/utils/deepClone";
import { getUniqueTaskId } from "@/utils/unique";

export const replaceTaskNode = (
  taskId: string,
  newComponentRef: ComponentReference,
  graphSpec: GraphSpec,
) => {
  const updatedGraphSpec = deepClone(graphSpec);

  const oldTaskId = taskId;
  const oldTask = deepClone(updatedGraphSpec.tasks[oldTaskId]) as TaskSpec;
  const oldTaskInputs = oldTask.componentRef.spec?.inputs;

  const newTaskInputs = newComponentRef.spec?.inputs;
  const newTaskOutputs = newComponentRef.spec?.outputs;
  const newTaskId = getUniqueTaskId(graphSpec, oldTaskId);

  // Migrate the task to the new componentRef
  const updatedTask = {
    ...oldTask,
  };

  updatedTask.componentRef = newComponentRef;

  // Determine which of the original task's inputs will be removed
  const lostInputs: InputSpec[] = [];

  if (oldTaskInputs) {
    oldTaskInputs.forEach((input: InputSpec) => {
      const inputName = input.name;

      if (newTaskInputs?.some((input: InputSpec) => input.name === inputName)) {
        return;
      }

      lostInputs.push(input);
    });
  }

  // Migrate Inputs
  const oldArguments = updatedTask.arguments;
  if (oldArguments) {
    const updatedArguments = Object.keys(oldArguments)
      .filter((arg) => !lostInputs.some((input) => input.name === arg))
      .reduce(
        (acc, key) => {
          acc[key] = oldArguments[key];
          return acc;
        },
        {} as Record<string, ArgumentType>,
      );

    updatedTask.arguments = updatedArguments;
  }

  // Migrate outputs
  Object.values(updatedGraphSpec.tasks).forEach((task) => {
    const updatedArguments = { ...task.arguments };

    Object.entries(updatedArguments).forEach(([inputName, argument]) => {
      if (
        typeof argument === "object" &&
        argument !== null &&
        "taskOutput" in argument &&
        argument.taskOutput &&
        argument.taskOutput.taskId === oldTaskId
      ) {
        const outputName = argument.taskOutput.outputName;

        if (newTaskOutputs?.some((output) => output.name === outputName)) {
          // Update the taskOutput taskId to the new taskId
          updatedArguments[inputName] = {
            ...argument,
            taskOutput: {
              ...argument.taskOutput,
              taskId: newTaskId,
            },
          };
        } else {
          // Remove the argument if the new task does not have the same output
          delete updatedArguments[inputName];
        }
      }
    });

    task.arguments = updatedArguments;
  });

  // Update GraphSpec
  delete updatedGraphSpec.tasks[oldTaskId];

  updatedGraphSpec.tasks = {
    ...updatedGraphSpec.tasks,
    [newTaskId]: updatedTask,
  };

  return { updatedGraphSpec, lostInputs, newTaskId, updatedTask } as const;
};
