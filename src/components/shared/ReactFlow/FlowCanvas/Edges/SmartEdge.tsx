import { getSmartEdge } from "@tisoap/react-flow-smart-edge";
import { BezierEdge, type EdgeProps, useNodes, useStore } from "@xyflow/react";
import { useMemo } from "react";

import { Text } from "@/components/ui/typography";

import { checkIntersection, removeDuplicatePoints } from "./line.utils";

const foreignObjectSize = 200;
const calculatedEdges = new Map<string, string>();

export function SmartEdge(props: EdgeProps) {
  const {
    id,
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerStart,
    markerEnd,
    selected,
    label,
  } = props;

  const nodes = useNodes();
  const edges = useStore((state) => state.edges);

  const getSmartEdgeResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    nodes,
    options: {
      gridRatio: 50,
    },
  });

  const { edgeCenterX, edgeCenterY, svgPathString } =
    getSmartEdgeResponse instanceof Error
      ? {
          edgeCenterX: 0,
          edgeCenterY: 0,
          svgPathString: undefined,
        }
      : getSmartEdgeResponse;

  const bridges = useMemo(() => {
    if (!svgPathString) {
      return [];
    }

    console.log(`Calculating bridges for ${id}`);

    return removeDuplicatePoints(
      edges
        .filter((edge) => edge.id !== id && calculatedEdges.has(edge.id))
        .map((edge) => calculatedEdges.get(edge.id) as string)
        .filter((edge) => edge !== undefined)
        .map((edge) => checkIntersection(edge, svgPathString as string))
        .filter((intersections) => intersections.length > 0)
        .flat(),
    );
  }, [calculatedEdges.size, svgPathString]);

  // If the value returned is an Error, it means "getSmartEdge" was unable
  // to find a valid path, and you should do something else instead
  if (getSmartEdgeResponse instanceof Error) {
    return <BezierEdge {...props} />;
  }

  const edgeColor = selected ? "#38bdf8" : "#6b7280";

  if (!calculatedEdges.has(id)) {
    calculatedEdges.set(id, svgPathString as string);
  }

  if (selected) {
    console.log(`svgPathString ${label}`, svgPathString);
    console.log(`edges ${label}`, edges);
    console.log(
      `calculatedEdges ${label}`,
      edges.map((edge) => calculatedEdges.get(edge.id)),
    );
    console.log(`bridges ${label}`, bridges);
  }

  return (
    <>
      <path
        id={id}
        style={{
          stroke: edgeColor,
          strokeWidth: 4,
          ...style,
        }}
        className="react-flow__edge-path"
        d={svgPathString}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {selected &&
        bridges.map((point) => (
          <g
            key={`${id}-${point.x}-${point.y}`}
            transform={`translate(${point.x}, ${point.y})`}
          >
            <path
              d="M -8,-4 Q 0,-8 8,-4"
              stroke={props.style?.stroke || "#b1b1b7"}
              strokeWidth={2}
              fill="none"
            />
            <rect x={-8} y={-2} width={16} height={4} fill="white" />
          </g>
        ))}
    </>
  );
}
