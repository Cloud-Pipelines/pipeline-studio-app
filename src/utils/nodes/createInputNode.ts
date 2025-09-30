import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { InputSpec } from "../componentSpec";
import { inputNameToInputId } from "./conversions";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";

export const createInputNode = (input: InputSpec, nodeData: NodeData) => {
  const { name, annotations } = input;
  const { nodeManager, readOnly } = nodeData;

  const inputId = inputNameToInputId(name);
  const nodeId = nodeManager.getNodeId(inputId, "input");

  const position = extractPositionFromAnnotations(annotations);

  const inputNodeData: IONodeData = {
    spec: input,
    readOnly,
  };

  return {
    id: nodeId,
    data: inputNodeData,
    position: position,
    type: "input",
  } as Node;
};
