import { type MouseEvent, type RefObject } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ArgumentType,
  ComponentSpec,
  InputSpec,
  OutputSpec,
} from "@/utils/componentSpec";
import { getValue } from "@/utils/string";

import { InputHandle, OutputHandle } from "./Handles";

type TaskNodeCardProps = {
  componentSpec: ComponentSpec;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  values?: Record<string, ArgumentType>;
  invalidArguments: string[];
  selected: boolean;
  highlighted?: boolean;
  nodeRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  onIOClick: () => void;
};

const TaskNodeCard = ({
  componentSpec,
  inputs = [],
  outputs = [],
  values,
  invalidArguments,
  selected,
  highlighted,
  nodeRef,
  onClick,
  onIOClick,
}: TaskNodeCardProps) => {
  const handleIOClicked = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    onIOClick();
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 max-w-[300px] min-w-[300px] break-words p-0 drop-shadow-none gap-2",
        selected ? "border-gray-500" : "hover:border-slate-200",
        highlighted && "border-orange-500",
      )}
      ref={nodeRef}
      onClick={onClick}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {componentSpec.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        {inputs.length > 0 && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            {inputs.map((input) => (
              <InputHandle
                key={input.name}
                name={input.name}
                defaultValue={input.default}
                invalid={invalidArguments.includes(input.name)}
                onClick={handleIOClicked}
                value={getValue(values?.[input.name])}
              />
            ))}
          </div>
        )}
        {outputs.length > 0 && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            {outputs.map((output) => (
              <OutputHandle
                key={output.name}
                name={output.name}
                onClick={handleIOClicked}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskNodeCard;
