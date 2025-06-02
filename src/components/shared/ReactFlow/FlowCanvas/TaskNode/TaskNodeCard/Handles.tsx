import { Handle, Position } from "@xyflow/react";
import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";
import type { InputSpec, OutputSpec } from "@/utils/componentSpec";

type InputHandleProps = {
  input: InputSpec;
  invalid: boolean;
  value?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
};

export const InputHandle = ({
  input,
  invalid,
  value,
  onClick,
}: InputHandleProps) => {
  const missing = invalid ? "bg-red-700!" : "bg-gray-500!";

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  const hasValue = value !== undefined && value !== "" && value !== null;
  const hasDefault = input.default !== undefined && input.default !== "";

  return (
    <div className="relative w-full h-fit" key={input.name}>
      <div className="absolute -translate-x-6 flex items-center h-3 w-3">
        <Handle
          type="target"
          id={`input_${input.name}`}
          position={Position.Left}
          isConnectable={true}
          className={cn("border-0! h-full! w-full! transform-none!", missing)}
        />
      </div>
      <div
        className={cn(
          "flex flex-row items-center rounded-md cursor-pointer relative",
          onClick && "hover:bg-gray-300",
        )}
        onClick={handleClick}
      >
        <div className="flex flex-row w-full gap-0.5 items-center justify-between">
          <div
            className={cn(
              "flex w-fit min-w-0",
              !value ? "max-w-full" : "max-w-3/4",
            )}
          >
            <div
              className={cn(
                "text-xs text-gray-800! bg-gray-200 rounded-md px-2 py-1 truncate",
                onClick && "hover:bg-gray-300",
              )}
            >
              {input.name.replace(/_/g, " ")}
            </div>
          </div>
          {(hasValue || hasDefault) && (
            <div className="flex w-fit max-w-1/2 min-w-0">
              <div
                className={cn(
                  "text-xs text-gray-800! truncate inline-block text-right pr-2",
                  !hasValue && "text-gray-500!",
                )}
              >
                {hasValue ? value : input.default}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type OutputHandleProps = {
  output: OutputSpec;
  value?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
};

export const OutputHandle = ({ output, value, onClick }: OutputHandleProps) => {
  const hasValue = value !== undefined && value !== "" && value !== null;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  return (
    <div className="flex items-center justify-end w-full" key={output.name}>
      <div className="flex flex-row-reverse w-full gap-0.5 items-center justify-between">
        <div
          className={cn(
            "translate-x-3 min-w-0 inline-block",
            !value ? "max-w-full" : "max-w-3/4",
          )}
        >
          <div
            className={cn(
              "text-xs text-gray-800! bg-gray-200 rounded-md px-2 py-1 truncate",
              onClick && "hover:bg-gray-300",
            )}
          >
            {output.name.replace(/_/g, " ")}
          </div>
        </div>
        {hasValue && (
          <div className="max-w-1/2 min-w-0 text-xs text-gray-800! truncate inline-block text-left pr-2">
            {value}
          </div>
        )}
      </div>
      <Handle
        type="source"
        id={`output_${output.name}`}
        position={Position.Right}
        isConnectable={true}
        onClick={handleClick}
        className={`
          relative!
          border-0!
          !w-[12px]
          !h-[12px]
          transform-none!
          translate-x-6
          cursor-pointer
          bg-gray-500!
          `}
      />
    </div>
  );
};
