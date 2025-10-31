import type { XYPosition } from "@xyflow/react";

import type { NodeType } from "@/types/nodes";
import {
  type ComponentSpec,
  type GraphSpec,
  type InputSpec,
  isGraphImplementation,
  type OutputSpec,
  type TaskSpec,
} from "@/utils/componentSpec";
import { deepClone } from "@/utils/deepClone";
import {
  getUniqueInputName,
  getUniqueOutputName,
  getUniqueTaskId,
} from "@/utils/unique";

const addTask = (
  nodeType: NodeType,
  taskSpec: TaskSpec | null,
  position: XYPosition,
  componentSpec: ComponentSpec,
): ComponentSpec => {
  const newComponentSpec = deepClone(componentSpec);

  if (!isGraphImplementation(newComponentSpec.implementation)) {
    console.error("Implementation does not contain a graph.");
    return newComponentSpec;
  }
  const graphSpec = newComponentSpec.implementation.graph;

  const nodePosition = { x: position.x, y: position.y };
  const positionAnnotations = {
    "editor.position": JSON.stringify(nodePosition),
  };

  if (nodeType === "task") {
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

    const uniqueTaskId = getUniqueTaskId(
      graphSpec,
      taskSpec.componentRef.spec?.name ?? "Task",
    );

    const newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: {
        ...graphSpec.tasks,
        [uniqueTaskId]: updatedTaskSpec,
      },
    };

    newComponentSpec.implementation.graph = newGraphSpec;
  }

  if (nodeType === "input") {
    const inputName = getUniqueInputName(newComponentSpec);
    const inputSpec: InputSpec = {
      name: inputName,
      annotations: positionAnnotations,
    };
    const inputs = (newComponentSpec.inputs ?? []).concat([inputSpec]);

    newComponentSpec.inputs = inputs;
  }

  if (nodeType === "output") {
    const outputName = getUniqueOutputName(newComponentSpec);
    const outputSpec: OutputSpec = {
      name: outputName,
      annotations: positionAnnotations,
    };

    const outputs = (newComponentSpec.outputs ?? []).concat([outputSpec]);

    newComponentSpec.outputs = outputs;
  }

  return newComponentSpec;
};

export default addTask;
