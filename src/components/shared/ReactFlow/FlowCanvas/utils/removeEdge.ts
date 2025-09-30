import type { Edge } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import type { ComponentSpec, GraphImplementation } from "@/utils/componentSpec";
import { outputIdToOutputName } from "@/utils/nodes/conversions";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const removeEdge = (
  edge: Edge,
  componentSpec: ComponentSpec,
  nodeManager: NodeManager,
) => {
  const graphSpec = (componentSpec.implementation as GraphImplementation)
    ?.graph;

  if (!edge.targetHandle) {
    return componentSpec;
  }

  const inputName = nodeManager.getHandleInfo(edge.targetHandle)?.handleName;

  const updatedComponentSpec = {
    ...componentSpec,
  };

  const taskId = nodeManager.getTaskId(edge.target);
  if (!taskId) return componentSpec;

  if (inputName !== undefined && graphSpec) {
    const newGraphSpec = setTaskArgument(graphSpec, taskId, inputName);
    updatedComponentSpec.implementation = {
      ...updatedComponentSpec.implementation,
      graph: newGraphSpec,
    };

    return updatedComponentSpec;
  } else {
    const outputName = outputIdToOutputName(taskId);
    const newGraphSpec = setGraphOutputValue(graphSpec, outputName);
    updatedComponentSpec.implementation = {
      ...updatedComponentSpec.implementation,
      graph: newGraphSpec,
    };

    return updatedComponentSpec;
  }
};
