import { useConnection, useEdges } from "@xyflow/react";
import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { useTaskNode } from "@/providers/TaskNodeProvider";
import type { OutputSpec } from "@/utils/componentSpec";
import { ComponentSearchFilter, DEFAULT_FILTERS } from "@/utils/constants";
import { outputNameToNodeId } from "@/utils/nodes/nodeIdUtils";
import { checkArtifactMatchesSearchFilters } from "@/utils/searchUtils";

import { OutputHandle } from "./Handles";

type TaskNodeOutputsProps = {
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
};

export function TaskNodeOutputs({
  condensed,
  expanded,
  onBackgroundClick,
}: TaskNodeOutputsProps) {
  const { nodeId, outputs, state, select } = useTaskNode();
  const {
    setSearchTerm,
    setSearchFilters,
    searchTerm,
    searchFilters,
    highlightSearchResults,
    setHighlightSearchResults,
  } = useComponentLibrary();

  const connection = useConnection();
  const edges = useEdges();

  const [isDragging, setIsDragging] = useState(false);

  const outputsWithTaskInput = outputs.filter((output) =>
    edges.some(
      (edge) =>
        edge.source === nodeId &&
        edge.sourceHandle === outputNameToNodeId(output.name),
    ),
  );

  const resetHighlightRelatedHandles = useCallback(() => {
    setSearchTerm("");
    setSearchFilters(DEFAULT_FILTERS);
    setHighlightSearchResults(false);
  }, [setSearchTerm, setSearchFilters, setHighlightSearchResults]);

  const toggleHighlightRelatedHandles = useCallback(
    (selected: boolean, output?: OutputSpec) => {
      if (selected && output) {
        const type = (output.type as string) || "[type undefined]";

        setSearchTerm(type);
        setSearchFilters([
          ComponentSearchFilter.INPUTTYPE,
          ComponentSearchFilter.EXACTMATCH,
        ]);
        setHighlightSearchResults(true);
      } else {
        resetHighlightRelatedHandles();
      }
    },
    [
      setSearchTerm,
      setSearchFilters,
      setHighlightSearchResults,
      resetHighlightRelatedHandles,
    ],
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
      if (state.readOnly) return;

      const output = outputs.find((o) => o.name === outputName);
      toggleHighlightRelatedHandles(selected, output);
    },
    [outputs, state.readOnly, toggleHighlightRelatedHandles],
  );

  const checkHighlight = useCallback(
    (output: OutputSpec) => {
      if (
        !highlightSearchResults ||
        searchTerm.length < 1 ||
        searchFilters.length < 1 ||
        !searchFilters.includes(ComponentSearchFilter.OUTPUTTYPE)
      ) {
        return false;
      }

      const matchFound = checkArtifactMatchesSearchFilters(
        searchTerm,
        searchFilters,
        output,
      );

      return matchFound;
    },
    [highlightSearchResults, searchTerm, searchFilters],
  );

  const handleLabelClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      select();
    },
    [select],
  );

  useEffect(() => {
    // Highlight relevant Handles when the user drags a new connection
    const { fromHandle, from, to, inProgress } = connection;

    if (!inProgress) {
      resetHighlightRelatedHandles();
      setIsDragging(false);
      return;
    }

    if (isDragging) {
      return;
    }

    if (
      from &&
      to &&
      Math.sqrt(Math.pow(from.x - to.x, 2) + Math.pow(from.y - to.y, 2)) < 4
    ) {
      // If the user has dragged the cursor less than 4px from the click origin, then assume it is a click event on the Handle
      setIsDragging(false);
      return;
    }

    const output = outputs.find(
      (o) => outputNameToNodeId(o.name) === fromHandle?.id,
    );

    if (!output) return;

    toggleHighlightRelatedHandles(true, output);
    setIsDragging(true);
  }, [connection, outputs, isDragging, toggleHighlightRelatedHandles]);

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
            highlight={checkHighlight(output)}
            onLabelClick={handleLabelClick}
          />
        ))
      ) : (
        <>
          {outputs.map((output) => (
            <OutputHandle
              key={output.name}
              output={output}
              onHandleSelectionChange={handleSelectionChange}
              highlight={checkHighlight(output)}
              onLabelClick={handleLabelClick}
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
