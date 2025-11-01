import type { Node, XYPosition } from "@xyflow/react";

export const isPositionInNode = (node: Node, position: XYPosition) => {
  const nodeRect = {
    x: node.position.x,
    y: node.position.y,
    width: node.measured?.width || 0,
    height: node.measured?.height || 0,
  };

  return (
    position.x >= nodeRect.x &&
    position.x <= nodeRect.x + nodeRect.width &&
    position.y >= nodeRect.y &&
    position.y <= nodeRect.y + nodeRect.height
  );
};

export const calculateNodesCenter = (
  nodes: Node[],
): { x: number; y: number } => {
  if (nodes.length === 0) return { x: 0, y: 0 };

  const sumX = nodes.reduce((sum, node) => sum + node.position.x, 0);
  const sumY = nodes.reduce((sum, node) => sum + node.position.y, 0);

  return {
    x: sumX / nodes.length,
    y: sumY / nodes.length,
  };
};

export const calculateNodesBounds = (nodes: Node[]) => {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...nodes.map((node) => node.position.x));
  const minY = Math.min(...nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + (node.measured?.width || 200)),
  );
  const maxY = Math.max(
    ...nodes.map((node) => node.position.y + (node.measured?.height || 100)),
  );

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

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
