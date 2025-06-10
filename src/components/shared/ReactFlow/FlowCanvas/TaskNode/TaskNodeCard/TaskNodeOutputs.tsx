import { useEdges } from "@xyflow/react";
import { type MouseEvent, useCallback } from "react";

import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { ComponentSearchFilter } from "@/utils/constants";

import { useTaskNode } from "../TaskNodeProvider";
import { OutputHandle } from "./Handles";

type TaskNodeOutputsProps = {
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
  handleIOClicked: (e: MouseEvent<HTMLDivElement>) => void;
};

export function TaskNodeOutputs({
  condensed,
  expanded,
  onBackgroundClick,
  handleIOClicked,
}: TaskNodeOutputsProps) {
  const { nodeId, outputs } = useTaskNode();
  const { setSearchTerm, setSearchFilters } = useComponentLibrary();
  const edges = useEdges();

  const outputsWithTaskInput = outputs.filter((output) =>
    edges.some(
      (edge) =>
        edge.source === nodeId && edge.sourceHandle === `output_${output.name}`,
    ),
  );

  const handleBackgroundClick = useCallback(
    (e: MouseEvent) => {
      if (condensed && onBackgroundClick) {
        e.stopPropagation();
        onBackgroundClick();
      }
    },
    [condensed, onBackgroundClick],
  );

  const handleSelectionChange = useCallback(
    (outputName: string, selected: boolean) => {
      if (selected) {
        const output = outputs.find((o) => o.name === outputName);
        const type = (output?.type as string | undefined) ?? "[type undefined]";

        setSearchTerm(type);
        setSearchFilters([
          ComponentSearchFilter.INPUTTYPE,
          ComponentSearchFilter.EXACTMATCH,
        ]);
      } else {
        setSearchTerm("");
        setSearchFilters([]);
      }
    },
    [setSearchTerm, setSearchFilters],
  );

  if (!outputs.length) return null;

  if (outputsWithTaskInput.length === 0) {
    outputsWithTaskInput.push(outputs[0]);
  }

  const hiddenOutputs = outputs.length - outputsWithTaskInput.length;
  if (hiddenOutputs < 1) {
    condensed = false;
  }

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
              hiddenOutputs > 0 && i === 0
                ? `+${hiddenOutputs} more output${hiddenOutputs > 1 ? "s" : ""}`
                : " "
            }
            onHandleSelectionChange={handleSelectionChange}
          />
        ))
      ) : (
        <>
          {outputs.map((output) => (
            <OutputHandle
              key={output.name}
              output={output}
              onLabelClick={handleIOClicked}
              onHandleSelectionChange={handleSelectionChange}
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
