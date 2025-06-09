import { AlertCircle } from "lucide-react";
import { type MouseEvent, useCallback } from "react";

import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { inputsWithInvalidArguments } from "@/services/componentService";
import { ComponentSearchFilter } from "@/utils/constants";
import { getValue } from "@/utils/string";

import { useTaskNode } from "../TaskNodeProvider";
import { InputHandle } from "./Handles";

interface TaskNodeInputsProps {
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
  handleIOClicked: (e: MouseEvent<HTMLDivElement>) => void;
}

export function TaskNodeInputs({
  condensed,
  expanded,
  onBackgroundClick,
  handleIOClicked,
}: TaskNodeInputsProps) {
  const { inputs, taskSpec } = useTaskNode();
  const { setSearchTerm, setSearchFilters } = useComponentLibrary();

  const values = taskSpec.arguments;
  const invalidArguments = inputsWithInvalidArguments(inputs, taskSpec);

  const inputsWithTaskOutput = inputs.filter(
    (input) =>
      values?.[input.name] &&
      typeof values[input.name] === "object" &&
      values[input.name] !== null &&
      "taskOutput" in (values[input.name] as object),
  );

  if (inputsWithTaskOutput.length === 0) {
    inputsWithTaskOutput.push(inputs[0]);
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

  const handleSelectionChange = useCallback(
    (inputName: string, selected: boolean) => {
      if (selected) {
        const input = inputs.find((i) => i.name === inputName);
        const type = input?.type as string;

        setSearchTerm(type);
        setSearchFilters([
          ComponentSearchFilter.OUTPUTTYPE,
          ComponentSearchFilter.EXACTMATCH,
        ]);
      } else {
        setSearchTerm("");
        setSearchFilters([]);
      }
    },
    [setSearchTerm, setSearchFilters],
  );

  if (!inputs.length) return null;

  const hiddenInputs = inputs.length - inputsWithTaskOutput.length;

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
              onLabelClick={handleIOClicked}
              value={getValue(values?.[input.name])}
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
