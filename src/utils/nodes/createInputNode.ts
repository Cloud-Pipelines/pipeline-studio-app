import { type Node } from "@xyflow/react";

import type { InputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { inputNameToNodeId } from "./nodeIdUtils";

export const createInputNode = (input: InputSpec) => {
  const { name, annotations, ...rest } = input;

  const position = extractPositionFromAnnotations(annotations);
  const nodeId = inputNameToNodeId(name);

  return {
    id: nodeId,
    data: {
      ...rest,
      label: name,
    },
    position: position,
    type: "input",
  } as Node;
};
