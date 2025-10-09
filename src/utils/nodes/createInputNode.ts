import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { InputSpec } from "../componentSpec";
import { inputIdToNodeId, inputNameToInputId } from "./conversions";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";

export const createInputNode = (input: InputSpec, nodeData: NodeData) => {
  const { name, annotations } = input;
  const { readOnly } = nodeData;

  const position = extractPositionFromAnnotations(annotations);
  const inputId = inputNameToInputId(name);
  const nodeId = inputIdToNodeId(inputId);

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
