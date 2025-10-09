import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { OutputSpec } from "../componentSpec";
import { outputIdToNodeId, outputNameToOutputId } from "./conversions";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";

export const createOutputNode = (output: OutputSpec, nodeData: NodeData) => {
  const { name, annotations } = output;
  const { readOnly } = nodeData;

  const position = extractPositionFromAnnotations(annotations);
  const outputId = outputNameToOutputId(name);
  const nodeId = outputIdToNodeId(outputId);

  const outputNodeData: IONodeData = {
    spec: output,
    readOnly,
  };

  return {
    id: nodeId,
    data: outputNodeData,
    position: position,
    type: "output",
  } as Node;
};
