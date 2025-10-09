import type { Edge } from "@xyflow/react";

import type { ComponentSpec, GraphImplementation } from "@/utils/componentSpec";
import {
  nodeIdToInputId,
  nodeIdToOutputId,
  nodeIdToTaskId,
} from "@/utils/nodes/conversions";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const removeEdge = (edge: Edge, componentSpec: ComponentSpec) => {
  const graphSpec = (componentSpec.implementation as GraphImplementation)
    ?.graph;

  if (!edge.targetHandle) {
    return componentSpec;
  }

  const inputName = nodeIdToInputId(edge.targetHandle);

  const updatedComponentSpec = {
    ...componentSpec,
  };

  if (inputName !== undefined && graphSpec) {
    const taskId = nodeIdToTaskId(edge.target);
    const newGraphSpec = setTaskArgument(graphSpec, taskId, inputName);
    updatedComponentSpec.implementation = {
      ...updatedComponentSpec.implementation,
      graph: newGraphSpec,
    };

    return updatedComponentSpec;
  } else {
    const outputId = nodeIdToOutputId(edge.target);
    const newGraphSpec = setGraphOutputValue(graphSpec, outputId);
    updatedComponentSpec.implementation = {
      ...updatedComponentSpec.implementation,
      graph: newGraphSpec,
    };

    return updatedComponentSpec;
  }
};
