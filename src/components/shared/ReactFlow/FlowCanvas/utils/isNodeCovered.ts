import { type Node } from "@xyflow/react";

export const isNodeCovered = (
  coveringNode: Node,
  targetNode: Node,
  threshold: number = 0.5,
) => {
  const clampedThreshold = Math.max(0, Math.min(1, threshold));

  const coveringNodeRect = {
    x: coveringNode.position.x,
    y: coveringNode.position.y,
    width: coveringNode.measured?.width || 0,
    height: coveringNode.measured?.height || 0,
  };

  const targetNodeRect = {
    x: targetNode.position.x,
    y: targetNode.position.y,
    width: targetNode.measured?.width || 0,
    height: targetNode.measured?.height || 0,
  };

  const overlapX = Math.max(
    0,
    Math.min(
      coveringNodeRect.x + coveringNodeRect.width,
      targetNodeRect.x + targetNodeRect.width,
    ) - Math.max(coveringNodeRect.x, targetNodeRect.x),
  );

  const overlapY = Math.max(
    0,
    Math.min(
      coveringNodeRect.y + coveringNodeRect.height,
      targetNodeRect.y + targetNodeRect.height,
    ) - Math.max(coveringNodeRect.y, targetNodeRect.y),
  );

  const overlapArea = overlapX * overlapY;
  const coveringNodeArea = coveringNodeRect.width * coveringNodeRect.height;
  const targetNodeArea = targetNodeRect.width * targetNodeRect.height;

  return (
    overlapArea >= clampedThreshold * Math.min(coveringNodeArea, targetNodeArea)
  );
};
