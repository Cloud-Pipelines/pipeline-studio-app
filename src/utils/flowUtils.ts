import type { Node } from "@xyflow/react";

export function deselectAllNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => ({ ...node, selected: false }));
}
