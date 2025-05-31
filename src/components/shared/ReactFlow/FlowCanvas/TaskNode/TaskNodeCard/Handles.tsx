import { Handle, Position } from "@xyflow/react";
import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";

type InputHandleProps = {
  invalid: boolean;
  value?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  name: string;
  defaultValue?: string;
};

export const InputHandle = ({
  name,
  defaultValue,
  invalid,
  value,
  onClick,
}: InputHandleProps) => {
  const missing = invalid ? "bg-red-700!" : "bg-gray-500!";

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  const hasValue = value !== undefined && value !== "" && value !== null;
  const hasDefault = defaultValue !== undefined && defaultValue !== "";

  return (
    <div
      className="flex flex-row items-center hover:bg-gray-300 rounded-md cursor-pointer"
      key={name}
      onClick={handleClick}
    >
      <Handle
        type="target"
        id={`input_${name}`}
        position={Position.Left}
        isConnectable={true}
        className={cn(
          "relative! border-0! !w-[12px] !h-[12px] transform-none! -translate-x-6 ",
          missing,
        )}
      />
      <div className="flex flex-row w-[250px] gap-0.5 items-center justify-between">
        <div
          className={cn(
            "-translate-x-3 min-w-0 inline-block",
            !value ? "max-w-full" : "max-w-3/4",
          )}
        >
          <div className="text-xs text-gray-800! bg-gray-200 rounded-md px-2 py-1 hover:bg-gray-300 truncate">
            {name.replace(/_/g, " ")}
          </div>
        </div>
        {(hasValue || hasDefault) && (
          <div
            className={cn(
              "max-w-1/2 min-w-0 text-xs text-gray-800! truncate inline-block text-right pr-2",
              !hasValue && "text-gray-500!",
            )}
          >
            {hasValue ? value : defaultValue}
          </div>
        )}
      </div>
    </div>
  );
};

type OutputHandleProps = {
  name: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
};

export const OutputHandle = ({ name, onClick }: OutputHandleProps) => {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  return (
    <div className="flex flex-row-reverse items-center" key={name}>
      <Handle
        type="source"
        id={`output_${name}`}
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
      <div
        className="text-xs text-gray-800! max-w-[250px] truncate bg-gray-200 cursor-pointer rounded-md px-2 py-1 translate-x-3 hover:bg-gray-300"
        onClick={handleClick}
      >
        {name.replace(/_/g, " ")}
      </div>
    </div>
  );
};
