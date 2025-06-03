import { useEdges } from "@xyflow/react";
import { type MouseEvent, useCallback } from "react";

import { cn } from "@/lib/utils";
import type { OutputSpec } from "@/utils/componentSpec";
import { taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";

import { OutputHandle } from "./Handles";

type TaskNodeOutputsProps = {
  outputs: OutputSpec[];
  taskId: string;
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
  handleIOClicked: (e: MouseEvent<HTMLDivElement>) => void;
};

export function TaskNodeOutputs({
  outputs,
  taskId,
  condensed,
  expanded,
  onBackgroundClick,
  handleIOClicked,
}: TaskNodeOutputsProps) {
  const edges = useEdges();

  const nodeId = taskIdToNodeId(taskId);

  const outputsWithTaskInput = outputs.filter((output) =>
    edges.some(
      (edge) =>
        edge.source === nodeId && edge.sourceHandle === `output_${output.name}`,
    ),
  );

  if (outputsWithTaskInput.length === 0) {
    outputsWithTaskInput.push(outputs[0]);
  }

  const handleBackgroundClick = useCallback(
    (e: MouseEvent) => {
      if (condensed && onBackgroundClick) {
        e.stopPropagation();
        onBackgroundClick();
      }
    },
    [condensed, onBackgroundClick],
  );

  if (!outputs.length) return null;

  const hiddenOutputs = outputs.length - outputsWithTaskInput.length;

  return (
    <div
      className={cn(
        "flex flex-col justify-end items-center gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg",
        condensed && onBackgroundClick && "hover:bg-gray-200/70 cursor-pointer",
      )}
      onClick={handleBackgroundClick}
    >
      {condensed && !expanded ? (
        outputsWithTaskInput.map((output, i) => (
          <OutputHandle
            key={output.name}
            output={output}
            value={
              outputs.length > 1 && i === 0
                ? `+${hiddenOutputs} more output${hiddenOutputs > 1 ? "s" : ""}`
                : " "
            }
          />
        ))
      ) : (
        <>
          {outputs.map((output) => (
            <OutputHandle
              key={output.name}
              output={output}
              onClick={handleIOClicked}
            />
          ))}
          {condensed && (
            <span className="text-xs text-gray-400 mt-1">
              (Click to collapse)
            </span>
          )}
        </>
      )}
    </div>
  );
}
