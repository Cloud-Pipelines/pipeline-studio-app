import type { Node } from "@xyflow/react";

import type { ComponentSpec } from "../componentSpec";

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

export const updateNodePositions = (
  updatedNodes: Node[],
  componentSpec: ComponentSpec,
  setComponentSpec: (componentSpec: ComponentSpec) => void,
) => {
  const newComponentSpec = { ...componentSpec };

  if (!("graph" in componentSpec.implementation)) {
    throw new Error("Component spec is not a graph");
  }
  const graphSpec = componentSpec.implementation.graph;

  for (const node of updatedNodes) {
    const positionAnnotation = JSON.stringify({
      x: node.position.x,
      y: node.position.y,
    });

    if (node.type === "task") {
      const taskId = nodeIdToTaskId(node.id);
      if (graphSpec.tasks[taskId]) {
        const taskSpec = { ...graphSpec.tasks[taskId] };
        taskSpec.annotations = {
          ...taskSpec.annotations,
          "editor.position": positionAnnotation,
        };

        const newGraphSpec = {
          ...graphSpec,
          tasks: {
            ...graphSpec.tasks,
            [taskId]: taskSpec,
          },
        };

        newComponentSpec.implementation = { graph: newGraphSpec };
      }
    } else if (node.type === "input") {
      const inputName = nodeIdToInputName(node.id);
      const inputs = [...(componentSpec.inputs || [])];
      const inputIndex = inputs.findIndex((input) => input.name === inputName);

      if (inputIndex >= 0) {
        inputs[inputIndex] = {
          ...inputs[inputIndex],
          annotations: {
            ...inputs[inputIndex].annotations,
            "editor.position": positionAnnotation,
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
        outputs[outputIndex] = {
          ...outputs[outputIndex],
          annotations: {
            ...outputs[outputIndex].annotations,
            "editor.position": positionAnnotation,
          },
        };
        newComponentSpec.outputs = outputs;
      }
    }
  }

  setComponentSpec(newComponentSpec);
};
