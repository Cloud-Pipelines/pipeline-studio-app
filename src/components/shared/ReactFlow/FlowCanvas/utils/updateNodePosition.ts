import type { Node } from "@xyflow/react";

import type { ComponentSpec } from "@/utils/componentSpec";

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

export const updateNodePositions = (
  updatedNodes: Node[],
  componentSpec: ComponentSpec,
) => {
  const newComponentSpec = { ...componentSpec };

  if (!("graph" in componentSpec.implementation)) {
    throw new Error("Component spec is not a graph");
  }

  for (const node of updatedNodes) {
    const newPosition = {
      x: node.position.x,
      y: node.position.y,
    };

    if (!("graph" in newComponentSpec.implementation)) {
      throw new Error("Implementation does not contain a graph");
    }

    const graphSpec = newComponentSpec.implementation.graph;

    if (node.type === "task") {
      const taskId = nodeIdToTaskId(node.id);
      if (graphSpec.tasks[taskId]) {
        const taskSpec = { ...graphSpec.tasks[taskId] };

        const currentPosition = JSON.parse(
          (taskSpec.annotations?.["editor.position"] as string) || "{}",
        );
        const updatedPosition = {
          ...currentPosition,
          ...newPosition,
        };

        const updatedPositionAnnotation = JSON.stringify(updatedPosition);

        taskSpec.annotations = {
          ...taskSpec.annotations,
          "editor.position": updatedPositionAnnotation,
        };

        const newGraphSpec = {
          ...graphSpec,
          tasks: {
            ...graphSpec.tasks,
            [taskId]: taskSpec,
          },
        };

        newComponentSpec.implementation.graph = newGraphSpec;
      }
    } else if (node.type === "input") {
      const inputName = nodeIdToInputName(node.id);
      const inputs = [...(componentSpec.inputs || [])];
      const inputIndex = inputs.findIndex((input) => input.name === inputName);

      if (inputIndex >= 0) {
        const currentPosition = JSON.parse(
          (inputs[inputIndex].annotations?.["editor.position"] as string) ||
            "{}",
        );
        const updatedPosition = {
          ...currentPosition,
          ...newPosition,
        };

        const updatedPositionAnnotation = JSON.stringify(updatedPosition);

        inputs[inputIndex] = {
          ...inputs[inputIndex],
          annotations: {
            ...inputs[inputIndex].annotations,
            "editor.position": updatedPositionAnnotation,
          },
        };
        newComponentSpec.inputs = inputs;
      }
    } else if (node.type === "output") {
      const outputName = nodeIdToOutputName(node.id);
      const outputs = [...(componentSpec.outputs || [])];
      const outputIndex = outputs.findIndex(
        (output) => output.name === outputName,
      );

      if (outputIndex >= 0) {
        const currentPosition = JSON.parse(
          (outputs[outputIndex].annotations?.["editor.position"] as string) ||
            "{}",
        );
        const updatedPosition = {
          ...currentPosition,
          ...newPosition,
        };

        const updatedPositionAnnotation = JSON.stringify(updatedPosition);

        outputs[outputIndex] = {
          ...outputs[outputIndex],
          annotations: {
            ...outputs[outputIndex].annotations,
            "editor.position": updatedPositionAnnotation,
          },
        };
        newComponentSpec.outputs = outputs;
      }
    }
  }

  return newComponentSpec;
};
