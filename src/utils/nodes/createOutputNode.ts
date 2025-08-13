import { type Node } from "@xyflow/react";

import type { OutputSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { outputNameToNodeId } from "./nodeIdUtils";

export const createOutputNode = (output: OutputSpec) => {
  const { name, annotations, ...rest } = output;

  const position = extractPositionFromAnnotations(annotations);
  const nodeId = outputNameToNodeId(name);

  return {
    id: nodeId,
    data: {
      ...rest,
      label: name,
    },
    position: position,
    type: "output",
  } as Node;
};
