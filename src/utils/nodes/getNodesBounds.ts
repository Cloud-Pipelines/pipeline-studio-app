import { type Node } from "@xyflow/react";

/*
 * 'getNodesBounds' from useReactFlow currently appears to be bugged and is producing the incorrect coordinates based on the old node position.
 * As a workaround this method calculates the node bounds origin and size manually.
 */
export const getNodesBounds = (nodes: Node[]) => {
  const bounds = nodes.reduce(
    (acc, node) => {
      if (!node.measured) {
        console.error("Node is missing measurement data:", node.id);
        return acc;
      }

      const width = node.measured?.width || 0;
      const height = node.measured?.height || 0;

      return {
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + width),
        maxY: Math.max(acc.maxY, node.position.y + height),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  return {
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    x: bounds.minX,
    y: bounds.minY,
  };
};
