import { Handle, Position } from "@xyflow/react";
import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";
import type { InputSpec, OutputSpec } from "@/utils/componentSpec";

type InputHandleProps = {
  input: InputSpec;
  invalidArguments: string[];
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  value?: string;
};

export const InputHandle = ({
  input,
  invalidArguments,
  onClick,
  value,
}: InputHandleProps) => {
  const isInvalid = invalidArguments.includes(input.name);
  const missing = isInvalid ? "bg-red-700!" : "bg-gray-500!";

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  const hasValue = value !== undefined && value !== "" && value !== null;
  const hasDefault = input.default !== undefined && input.default !== "";

  return (
    <div
      className="flex flex-row items-center hover:bg-gray-300 rounded-md cursor-pointer"
      key={input.name}
      onClick={handleClick}
    >
      <Handle
        type="target"
        id={`input_${input.name}`}
        position={Position.Left}
        isConnectable={true}
        className={cn(
          "relative! border-0! !w-[12px] !h-[12px] transform-none! -translate-x-6 ",
          missing,
        )}

      />
      <div className="flex flex-row w-[250px] gap-0.5 items-center justify-between">
        <div
          className={`-translate-x-3 min-w-0 ${!value ? "max-w-full" : "max-w-[75%]"} inline-block`}
        >
          <div className="text-xs text-gray-800! bg-gray-200 rounded-md px-2 py-1 hover:bg-gray-300 truncate">
            {input.name.replace(/_/g, " ")}
          </div>
        </div>
        {(hasValue || hasDefault) && (
          <div
            className={cn(
              "max-w-[50%] min-w-0 text-xs text-gray-800! truncate inline-block text-right pr-2",
              !hasValue && "text-gray-500!",
            )}
          >
            {hasValue ? value : input.default}
          </div>
        )}
      </div>
    </div>
  );
};

type OutputHandleProps = {
  output: OutputSpec;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
};

export const OutputHandle = ({ output, onClick }: OutputHandleProps) => {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  return (
    <div className="flex flex-row-reverse items-center" key={output.name}>
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
          bg-gray-500!
          cursor-pointer
          `}
      />
      <div
        className="text-xs text-gray-800! max-w-[250px] truncate bg-gray-200 cursor-pointer rounded-md px-2 py-1 translate-x-3 hover:bg-gray-300"
        onClick={handleClick}
      >
        {output.name.replace(/_/g, " ")}
      </div>
    </div>
  );
};
