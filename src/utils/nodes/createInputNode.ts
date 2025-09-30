import { type Node } from "@xyflow/react";

import type { IONodeData, NodeData } from "@/types/nodes";

import type { InputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { inputNameToInputId } from "./nodeIdUtils";

export const createInputNode = (input: InputSpec, nodeData: NodeData) => {
  const { name, annotations } = input;
  const { nodeManager, readOnly } = nodeData;

  const inputId = inputNameToInputId(name);
  const nodeId = nodeManager.getNodeId(inputId, "input");
  console.log("Creating input node:", { name, nodeId });

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
