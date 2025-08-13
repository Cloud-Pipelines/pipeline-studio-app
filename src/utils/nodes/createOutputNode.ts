import { type Node } from "@xyflow/react";

import type { OutputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { outputNameToNodeId } from "./nodeIdUtils";

export const createOutputNode = (output: OutputSpec) => {
  const position = extractPositionFromAnnotations(output.annotations);
  const nodeId = outputNameToNodeId(output.name);

  return {
    id: nodeId,
    data: {
      ...output,
      label: output.name,
    },
    position: position,
    type: "output",
  } as Node;
};
