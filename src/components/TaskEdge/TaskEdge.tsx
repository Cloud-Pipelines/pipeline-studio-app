import { BaseEdge, getStraightPath, MarkerType, type EdgeProps } from '@xyflow/react';

const TaskEdge = ({ id, sourceX, sourceY, targetX, targetY, markerEnd = MarkerType.ArrowClosed }: EdgeProps) => {
  const BUFFER_DISTANCE = 7; // pixels to move from source/target

  // Calculate the total distance
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the adjusted source and target points
  const ratio = BUFFER_DISTANCE / distance;
  const sourceRatio = ratio;
  const targetRatio = 1 - ratio;

  const adjustedSourceX = sourceX + dx * sourceRatio;
  const adjustedSourceY = sourceY + dy * sourceRatio;
  const adjustedTargetX = sourceX + dx * targetRatio;
  const adjustedTargetY = sourceY + dy * targetRatio;

  const [edgePath] = getStraightPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
      />
      <circle r="4" fill="#ff0073" opacity="0.6">
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}

export default TaskEdge;

