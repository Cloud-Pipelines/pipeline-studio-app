import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { OutputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { outputNameToNodeId } from "./nodeIdUtils";

export const createOutputNode = (output: OutputSpec, nodeData: NodeData) => {
  const { name, annotations } = output;
  const { nodeManager, readOnly } = nodeData;

  const newNodeId = nodeManager?.getNodeId(name, "output");
  console.log("Creating output node:", { name, nodeId: newNodeId });

  const position = extractPositionFromAnnotations(annotations);
  const nodeId = outputNameToNodeId(name);

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
