import { useLocation } from "@tanstack/react-router";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo } from "react";

import { InputValueEditor } from "@/components/Editor/IOEditor/InputValueEditor";
import { OutputNameEditor } from "@/components/Editor/IOEditor/OutputNameEditor";
import { getOutputConnectedDetails } from "@/components/Editor/utils/getOutputConnectedDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { deselectAllNodes } from "@/utils/flowUtils";

interface IONodeProps {
  type: "input" | "output";
  data: {
    label: string;
    value?: string;
    default?: string;
    type?: string;
  };
  selected: boolean;
  deletable: boolean;
}

const IONode = ({ type, data, selected = false }: IONodeProps) => {
  const { setNodes } = useReactFlow();
  const location = useLocation();
  const { graphSpec, componentSpec } = useComponentSpec();
  const { setContent, clearContent } = useContextPanel();

  const isPipelineEditor = location.pathname.includes("/editor");

  const isInput = type === "input";
  const isOutput = type === "output";

  const handleType = isInput ? "source" : "target";
  const handlePosition = isInput ? Position.Right : Position.Left;
  const selectedColor = isInput
    ? "border-blue-500 bg-blue-100"
    : "border-violet-500 bg-violet-100";
  const defaultColor = isInput
    ? "border-blue-300 bg-blue-100"
    : "border-violet-300 bg-violet-100";
  const borderColor = selected ? selectedColor : defaultColor;

  const input = useMemo(
    () => componentSpec.inputs?.find((input) => input.name === data.label),
    [componentSpec.inputs, data.label],
  );

  const output = useMemo(
    () => componentSpec.outputs?.find((output) => output.name === data.label),
    [componentSpec.outputs, data.label],
  );

  const deselectNode = useCallback(() => {
    setNodes(deselectAllNodes);
    clearContent();
  }, [setNodes]);

  useEffect(() => {
    if (selected) {
      if (input && isInput) {
        setContent(
          <InputValueEditor
            input={input}
            key={input.name}
            disabled={!isPipelineEditor}
            onClose={deselectNode}
          />,
        );
      }

      if (output && isOutput) {
        const outputConnectedDetails = getOutputConnectedDetails(
          graphSpec,
          output.name,
        );
        setContent(
          <OutputNameEditor
            output={output}
            connectedDetails={outputConnectedDetails}
            key={output.name}
            disabled={!isPipelineEditor}
            onClose={deselectNode}
          />,
        );
      }
    }
  }, [input, output, selected]);

  const connectedOutput = getOutputConnectedDetails(graphSpec, data.label);
  const outputConnectedValue = connectedOutput.outputName;
  const outputConnectedType = connectedOutput.outputType;
  const outputConnectedTaskId = connectedOutput.taskId;

  const handleDefaultClassName =
    "!w-[12px] !h-[12px] !border-0 !transform-none !bg-gray-500";

  const handleClassName = isInput ? "translate-x-1.5" : "-translate-x-1.5";

  return (
    <Card
      className={cn(
        "rounded-2xl border-2 max-w-[300px] break-words p-0 drop-shadow-none",
        borderColor,
      )}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        {/* type */}
        <div className="text-xs text-slate-700 font-mono truncate max-w-[250px]">
          <span className="font-bold text-slate-700">Type:</span>{" "}
          {outputConnectedType ?? data.type ?? "Any"}
        </div>

        {!!outputConnectedTaskId && (
          <span className="font-bold text-slate-700">
            {outputConnectedTaskId}
          </span>
        )}

        {/* value */}
        <div className={cn("flex flex-col gap-3 p-2 bg-white rounded-lg")}>
          {isInput && (
            <div
              className={cn(
                "text-xs text-slate-700 font-mono truncate max-w-[250px]",
                {
                  "text-red-500": !data.value && !data.default,
                },
              )}
            >
              <span className="font-bold text-slate-700">Value:</span>{" "}
              {data.value ?? data.default ?? "No value"}
            </div>
          )}
          {isOutput && (
            <div
              className={cn(
                "text-xs text-slate-700 font-mono truncate max-w-[250px]",
                {
                  "text-red-500": !outputConnectedValue,
                },
              )}
            >
              <span className="font-bold text-slate-700">From:</span>{" "}
              {outputConnectedValue ?? "Not connected"}
            </div>
          )}
          <Handle
            type={handleType}
            position={handlePosition}
            className={cn(handleDefaultClassName, handleClassName)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
