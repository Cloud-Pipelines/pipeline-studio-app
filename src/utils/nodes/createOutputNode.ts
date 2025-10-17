import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { OutputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";

export const createOutputNode = (output: OutputSpec, nodeData: NodeData) => {
  const { name, annotations } = output;
  const { nodeManager, readOnly } = nodeData;

  const nodeId = nodeManager.getNodeId(name, "output");

  const position = extractPositionFromAnnotations(annotations);

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
