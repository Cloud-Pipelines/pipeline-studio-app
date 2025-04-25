import type { Edge } from "@xyflow/react";

import type { ComponentSpec, GraphImplementation } from "@/utils/componentSpec";
import { nodeIdToOutputName, nodeIdToTaskId } from "@/utils/nodes/nodeIdUtils";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const removeEdge = (edge: Edge, componentSpec: ComponentSpec) => {
  const graphSpec = (componentSpec.implementation as GraphImplementation)
    ?.graph;

  const inputName = edge.targetHandle?.replace(/^input_/, "");

  if (inputName !== undefined && graphSpec) {
    const taskId = nodeIdToTaskId(edge.target);
    const newGraphSpec = setTaskArgument(graphSpec, taskId, inputName);
    componentSpec.implementation = {
      ...componentSpec.implementation,
      graph: newGraphSpec,
    };
    return componentSpec;
  } else {
    const outputName = nodeIdToOutputName(edge.target);
    const newGraphSpec = setGraphOutputValue(graphSpec, outputName);
    componentSpec.implementation = {
      ...componentSpec.implementation,
      graph: newGraphSpec,
    };
    return componentSpec;
  }
};
