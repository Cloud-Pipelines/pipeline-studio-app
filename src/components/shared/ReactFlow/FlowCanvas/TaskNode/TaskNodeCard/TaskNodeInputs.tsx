import { useConnection } from "@xyflow/react";
import { AlertCircle } from "lucide-react";
import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { useNodeManager } from "@/hooks/useNodeManager";
import { cn } from "@/lib/utils";
import { useForcedSearchContext } from "@/providers/ComponentLibraryProvider/ForcedSearchProvider";
import { isValidFilterRequest } from "@/providers/ComponentLibraryProvider/types";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useTaskNode } from "@/providers/TaskNodeProvider";
import { inputsWithInvalidArguments } from "@/services/componentService";
import type { InputSpec } from "@/utils/componentSpec";
import { ComponentSearchFilter } from "@/utils/constants";
import { checkArtifactMatchesSearchFilters } from "@/utils/searchUtils";

import { InputHandle } from "./Handles";
import { getDisplayValue } from "./handleUtils";

interface TaskNodeInputsProps {
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
}

export function TaskNodeInputs({
  condensed,
  expanded,
  onBackgroundClick,
}: TaskNodeInputsProps) {
  const { getInputHandleNodeId } = useNodeManager();
  const { taskId, inputs, taskSpec, state, select } = useTaskNode();
  const { graphSpec } = useComponentSpec();
  const {
    highlightSearchFilter,
    resetSearchFilter,
    currentSearchFilter,
    highlightSearchResults,
  } = useForcedSearchContext();

  const connection = useConnection();

  const [isDragging, setIsDragging] = useState(false);

  const values = taskSpec.arguments;
  const invalidArguments = inputsWithInvalidArguments(inputs, taskSpec);

  const inputsWithTaskOutput = inputs.filter(
    (input) =>
      values?.[input.name] &&
      typeof values[input.name] === "object" &&
      values[input.name] !== null &&
      "taskOutput" in (values[input.name] as object),
  );

  const toggleHighlightRelatedHandles = useCallback(
    (selected: boolean, input?: InputSpec) => {
      if (selected && input) {
        const type = (input.type as string) || "[type undefined]";

        highlightSearchFilter({
          searchTerm: type,
          filters: [
            ComponentSearchFilter.OUTPUTTYPE,
            ComponentSearchFilter.EXACTMATCH,
          ],
        });
      } else {
        resetSearchFilter();
      }
    },
    [highlightSearchFilter, resetSearchFilter],
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
    (inputName: string, selected: boolean) => {
      if (state.readOnly) return;

      const input = inputs.find((i) => i.name === inputName);
      toggleHighlightRelatedHandles(selected, input);
    },
    [inputs, state.readOnly, toggleHighlightRelatedHandles],
  );

  const checkHighlight = useCallback(
    (input: InputSpec) => {
      if (
        !highlightSearchResults ||
        !isValidFilterRequest(currentSearchFilter, {
          includesFilter: ComponentSearchFilter.INPUTTYPE,
        })
      ) {
        return false;
      }

      const matchFound = checkArtifactMatchesSearchFilters(
        currentSearchFilter.searchTerm,
        currentSearchFilter.filters,
        input,
      );

      return matchFound;
    },
    [currentSearchFilter, highlightSearchResults],
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
      resetSearchFilter();
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

    const input = inputs.find(
      (i) => getInputHandleNodeId(taskId, i.name) === fromHandle?.id,
    );

    if (!input) return;

    toggleHighlightRelatedHandles(true, input);
    setIsDragging(true);
  }, [
    connection,
    inputs,
    isDragging,
    resetSearchFilter,
    toggleHighlightRelatedHandles,
  ]);

  if (!inputs.length) return null;

  if (inputsWithTaskOutput.length === 0) {
    inputsWithTaskOutput.push(inputs[0]);
  }

  const hiddenInputs = inputs.length - inputsWithTaskOutput.length;
  if (hiddenInputs < 1) {
    condensed = false;
  }

  const hiddenInvalidArguments = invalidArguments.filter(
    (invalidArgument) =>
      !inputsWithTaskOutput.some((input) => input.name === invalidArgument),
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg",
        condensed && onBackgroundClick && "hover:bg-gray-200/70 cursor-pointer",
      )}
      onClick={handleBackgroundClick}
    >
      {condensed && !expanded ? (
        <>
          {inputsWithTaskOutput.map((input, i) => (
            <InputHandle
              key={input.name}
              input={input}
              invalid={invalidArguments.includes(input.name)}
              value={
                hiddenInputs > 0 && i === 0
                  ? `+${hiddenInputs} more input${hiddenInputs > 1 ? "s" : ""}`
                  : " "
              }
              onHandleSelectionChange={handleSelectionChange}
              highlight={checkHighlight(input)}
              onLabelClick={handleLabelClick}
            />
          ))}
          {hiddenInvalidArguments.length > 0 && (
            <div className="flex text-xs text-destructive-foreground mt-1 items-center">
              <AlertCircle className="h-4 w-4 inline-block mr-1" />
              <span>{`${hiddenInvalidArguments.length} hidden input${hiddenInvalidArguments.length > 1 ? "s have" : " has"} invalid arguments`}</span>
            </div>
          )}
        </>
      ) : (
        <>
          {inputs.map((input) => (
            <InputHandle
              key={input.name}
              input={input}
              invalid={invalidArguments.includes(input.name)}
              value={getDisplayValue(values?.[input.name], graphSpec)}
              onHandleSelectionChange={handleSelectionChange}
              highlight={checkHighlight(input)}
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
