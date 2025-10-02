import type { Edge } from "@xyflow/react";

import type { NodeManager } from "@/nodeManager";
import {
  type ComponentSpec,
  isGraphImplementation,
} from "@/utils/componentSpec";
import { outputIdToOutputName } from "@/utils/nodes/conversions";

import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

export const removeEdge = (
  edge: Edge,
  componentSpec: ComponentSpec,
  nodeManager: NodeManager,
) => {
  if (!isGraphImplementation(componentSpec.implementation)) {
    return componentSpec;
  }

  const graphSpec = componentSpec.implementation.graph;
  const updatedComponentSpec = { ...componentSpec };

  const targetNodeId = edge.target;
  const targetTaskId = nodeManager.getTaskId(targetNodeId);
  const targetNodeType = nodeManager.getNodeType(targetNodeId);

  if (!targetTaskId || !targetNodeType) {
    console.error("Could not resolve target node information:", {
      targetNodeId,
      targetTaskId,
      targetNodeType,
    });
    return componentSpec;
  }

  switch (targetNodeType) {
    case "task": {
      if (!edge.targetHandle) {
        console.error("No target handle found for task connection");
        return componentSpec;
      }

      const targetHandleInfo = nodeManager.getHandleInfo(edge.targetHandle);
      if (!targetHandleInfo) {
        console.error("Could not resolve target handle info");
        return componentSpec;
      }

      const inputName = targetHandleInfo.handleName;
      const newGraphSpec = setTaskArgument(graphSpec, targetTaskId, inputName);

      updatedComponentSpec.implementation = {
        ...updatedComponentSpec.implementation,
        graph: newGraphSpec,
      };
      break;
    }

    case "output": {
      const outputName = outputIdToOutputName(targetTaskId);
      const newGraphSpec = setGraphOutputValue(graphSpec, outputName);

      updatedComponentSpec.implementation = {
        ...updatedComponentSpec.implementation,
        graph: newGraphSpec,
      };
      break;
    }

    default:
      console.error(
        "Unsupported target node type for edge removal:",
        targetNodeType,
      );
      return componentSpec;
  }

  return updatedComponentSpec;
};
