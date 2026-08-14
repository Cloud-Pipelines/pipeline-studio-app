import { type Node } from "@xyflow/react";

import type { TaskNodeData } from "@/types/taskNode";

import {
  extractPositionFromAnnotations,
  extractZIndexFromAnnotations,
} from "../annotations";
import type { OutputSpec } from "../componentSpec";
import { outputNameToNodeId } from "./nodeIdUtils";

export const createOutputNode = (
  output: OutputSpec,
  nodeData: TaskNodeData,
  readOnly?: boolean,
) => {
  const nodeType = "output";

  const { name, annotations, ...rest } = output;

  const position = extractPositionFromAnnotations(annotations);
  const zIndex = extractZIndexFromAnnotations(output.annotations, nodeType);

  const nodeId = outputNameToNodeId(name);

  return {
    id: nodeId,
    data: {
      ...rest,
      ...nodeData,
      label: name,
      readOnly: readOnly ?? nodeData.readOnly ?? false,
    },
    position: position,
    type: nodeType,
    zIndex,
  } as Node;
};
