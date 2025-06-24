import { Handle, Position, useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect } from "react";

import { InputValueEditor } from "@/components/Editor/InputValueEditor/InputValueEditor";
import { OutputNameEditor } from "@/components/Editor/OutputNameEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";

interface IONodeProps {
  type: "input" | "output";
  data: {
    label: string;
    value?: string;
    default?: string;
    type?: string;
  };
  selected: boolean;
}

const IONode = ({ type, data, selected = false }: IONodeProps) => {
  const { setNodes } = useReactFlow();
  const { graphSpec, componentSpec } = useComponentSpec();
  const { setContent, clearContent } = useContextPanel();

  const handleType = type === "input" ? "source" : "target";
  const handlePosition = type === "input" ? Position.Right : Position.Left;
  const selectedBorderColor =
    type === "input"
      ? "border-blue-500 bg-blue-100"
      : "border-violet-500 bg-violet-100";
  const defaultBorderColor =
    type === "input"
      ? "border-blue-300 bg-blue-100"
      : "border-violet-300 bg-violet-100";
  const borderColor = selected ? selectedBorderColor : defaultBorderColor;

  const input = componentSpec.inputs?.find(
    (input) => input.name === data.label,
  );

  const output = componentSpec.outputs?.find(
    (output) => output.name === data.label,
  );

  const deselectNode = useCallback(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({ ...node, selected: false })),
    );
    clearContent();
  }, [setNodes]);

  useEffect(() => {
    if (selected) {
      if (input) {
        setContent(
          <InputValueEditor
            input={input}
            key={input.name}
            onSave={deselectNode}
          />,
        );
      }

      if (output) {
        setContent(
          <OutputNameEditor
            output={output}
            key={output.name}
            onSave={deselectNode}
          />,
        );
      }
    }
  }, [selected]);

  // For output nodes, get the connected value from graphSpec.outputValues
  let outputConnectedValue: string | undefined = undefined;
  if (type === "output" && graphSpec?.outputValues) {
    const outputName = data.label;
    const outputValue = graphSpec.outputValues[outputName];
    if (
      outputValue &&
      typeof outputValue === "object" &&
      "taskOutput" in outputValue
    ) {
      outputConnectedValue = outputValue.taskOutput.outputName;
    }
  }

  const handleClassName =
    type === "input"
      ? "!w-[12px] !h-[12px] !border-0! !w-[12px] !h-[12px] transform-none! translate-x-1.5 translate-y-4 cursor-pointer bg-gray-500! border-none!"
      : "!w-[12px] !h-[12px] !border-0! !w-[12px] !h-[12px] transform-none! -translate-x-1.5 translate-y-4 cursor-pointer bg-gray-500! border-none!";

  return (
    <Card
      className={`rounded-2xl ${borderColor} border-2 max-w-[300px] break-words p-0 drop-shadow-none gap-2`}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        <div className="text-xs text-slate-700 font-mono truncate max-w-[250px]">
          <span className="font-bold text-slate-700">Type:</span>{" "}
          {data.type || "Any"}
        </div>
        <div className={cn("flex flex-col gap-3 p-2 bg-white rounded-lg")}>
          {type === "input" && (
            <div
              className={cn(
                "text-xs text-slate-700 font-mono truncate max-w-[250px]",
                {
                  "text-red-500":
                    type === "input" && !data.value && !data.default,
                },
              )}
            >
              <span className="font-bold text-slate-700">Value:</span>{" "}
              {data.value || data.default || "No value"}
            </div>
          )}
          {type === "output" && (
            <div
              className={cn(
                "text-xs text-slate-700 font-mono truncate max-w-[250px]",
                {
                  "text-red-500": type === "output" && !outputConnectedValue,
                },
              )}
            >
              <span className="font-bold text-slate-700">From:</span>{" "}
              {outputConnectedValue || "Not connected"}
            </div>
          )}
          <Handle
            type={handleType}
            position={handlePosition}
            className={handleClassName}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
