import type { XYPosition } from "@xyflow/react";

import type { TaskType } from "@/types/nodes";
import {
  type ComponentSpec,
  type GraphSpec,
  type InputSpec,
  isGraphImplementation,
  type OutputSpec,
  type TaskSpec,
} from "@/utils/componentSpec";
import {
  getUniqueInputName,
  getUniqueOutputName,
  getUniqueTaskName,
} from "@/utils/unique";

const addTask = (
  taskType: TaskType,
  taskSpec: TaskSpec | null,
  position: XYPosition,
  componentSpec: ComponentSpec,
): ComponentSpec => {
  const newComponentSpec = { ...componentSpec };

  if (!isGraphImplementation(newComponentSpec.implementation)) {
    console.error("Implementation does not contain a graph.");
    return newComponentSpec;
  }
  const graphSpec = newComponentSpec.implementation.graph;

  const nodePosition = { x: position.x, y: position.y };
  const positionAnnotations = {
    "editor.position": JSON.stringify(nodePosition),
  };

  if (taskType === "task") {
    if (!taskSpec) {
      console.error("A taskSpec is required to create a task node.");
      return newComponentSpec;
    }

    const taskArguments = taskSpec.componentRef.spec?.inputs?.reduce(
      (acc, input) => {
        if (input.default) {
          acc[input.name] = input.default;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    const mergedAnnotations = {
      ...taskSpec.annotations,
      ...positionAnnotations,
    };

    const updatedTaskSpec: TaskSpec = {
      ...taskSpec,
      annotations: mergedAnnotations,
      arguments: taskArguments ?? {},
    };

    const taskId = getUniqueTaskName(
      graphSpec,
      taskSpec.componentRef.spec?.name ?? "Task",
    );

    const newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: {
        ...graphSpec.tasks,
        [taskId]: updatedTaskSpec,
      },
    };

    newComponentSpec.implementation.graph = newGraphSpec;
  }

  if (taskType === "input") {
    const inputId = getUniqueInputName(componentSpec);
    const inputSpec: InputSpec = {
      name: inputId,
      annotations: positionAnnotations,
    };
    const inputs = (componentSpec.inputs ?? []).concat([inputSpec]);

    newComponentSpec.inputs = inputs;
  }

  if (taskType === "output") {
    const outputId = getUniqueOutputName(componentSpec);
    const outputSpec: OutputSpec = {
      name: outputId,
      annotations: positionAnnotations,
    };

    const outputs = (componentSpec.outputs ?? []).concat([outputSpec]);

    newComponentSpec.outputs = outputs;
  }

  return newComponentSpec;
};

export default addTask;
