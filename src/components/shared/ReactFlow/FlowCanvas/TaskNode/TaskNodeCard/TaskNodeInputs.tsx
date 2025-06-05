import { AlertCircle } from "lucide-react";
import { type MouseEvent, useCallback } from "react";

import { cn } from "@/lib/utils";
import type { ArgumentType, InputSpec } from "@/utils/componentSpec";
import { taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";
import { getValue } from "@/utils/string";

import { InputHandle } from "./Handles";

interface TaskNodeInputsProps {
  inputs: InputSpec[];
  invalidArguments: string[];
  taskId: string;
  values?: Record<string, ArgumentType>;
  condensed: boolean;
  expanded: boolean;
  onBackgroundClick?: () => void;
  handleIOClicked: (e: MouseEvent<HTMLDivElement>) => void;
}

export function TaskNodeInputs({
  inputs,
  invalidArguments,
  taskId,
  values,
  condensed,
  expanded,
  onBackgroundClick,
  handleIOClicked,
}: TaskNodeInputsProps) {
  const nodeId = taskIdToNodeId(taskId);

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
              nodeId={nodeId}
              value={
                inputs.length > 1 && i === 0
                  ? `+${hiddenInputs} more input${hiddenInputs > 1 ? "s" : ""}`
                  : " "
              }
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
              nodeId={nodeId}
              onLabelClick={handleIOClicked}
              value={getValue(values?.[input.name])}
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
