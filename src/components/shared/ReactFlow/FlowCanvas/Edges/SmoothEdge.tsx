import type { EdgeProps } from "@xyflow/react";
import { getBezierPath } from "@xyflow/react";

const SmoothEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <svg style={{ height: 0 }}>
        <defs>
          <marker
            id="end-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="7"
            refY="5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L10,5 L0,10 Z" className="fill-gray-500" />
          </marker>
          <marker
            id="start-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="3"
            refY="5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L10,5 L0,10 Z" className="fill-gray-500" />
          </marker>
        </defs>
      </svg>
      <path
        id={id}
        d={edgePath}
        markerEnd="url(#end-arrow)"
        markerStart="url(#start-arrow)"
        className="react-flow__edge-path stroke-gray-500! stroke-3! "
      />
    </>
  );
};

export default SmoothEdge;
