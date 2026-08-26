import type { Node } from "@xyflow/react";

import type { FlexNodeData } from "./FlexNode/types";
const nodeTypes: Record<string, true> = {
  task: true,
  input: true,
  output: true,
  ghost: true,
  flex: true,
};

export type NodeType = keyof typeof nodeTypes;

export function isDefinedNode(node: Node): node is Node & { type: NodeType } {
  return !!node.type && node.type in nodeTypes;
}

export function isFlexNode(node: Node): node is Node<FlexNodeData> {
  return node.type === "flex";
}
