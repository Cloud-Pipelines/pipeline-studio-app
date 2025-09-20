import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { InputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { inputNameToNodeId } from "./nodeIdUtils";

export const createInputNode = (input: InputSpec, nodeData: NodeData) => {
  const { name, annotations } = input;
  const { readOnly } = nodeData;

  const position = extractPositionFromAnnotations(annotations);
  const nodeId = inputNameToNodeId(name);

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
