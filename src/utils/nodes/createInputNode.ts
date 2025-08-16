import { type Node } from "@xyflow/react";

import type { InputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { inputNameToNodeId } from "./nodeIdUtils";

export const createInputNode = (input: InputSpec) => {
  const position = extractPositionFromAnnotations(input.annotations);
  const nodeId = inputNameToNodeId(input.name);

  return {
    id: nodeId,
    data: {
      ...input,
      label: input.name,
    },
    position: position,
    type: "input",
  } as Node;
};
