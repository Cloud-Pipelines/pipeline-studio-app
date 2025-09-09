import { useLocation } from "@tanstack/react-router";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo } from "react";

import { InputValueEditor } from "@/components/Editor/InputValueEditor/InputValueEditor";
import { OutputNameEditor } from "@/components/Editor/OutputNameEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import { deselectAllNodes } from "@/utils/flowUtils";

import { getOutputConnectedDetails } from "../utils/getOutputConnectedDetails";

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
      if (input && type === "input") {
        setContent(
          <InputValueEditor
            input={input}
            key={input.name}
            disabled={!isPipelineEditor}
            onClose={deselectNode}
          />,
        );
      }

      if (output && type === "output") {
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
    "!w-[12px] !h-[12px] !border-0! !w-[12px] !h-[12px] transform-none! cursor-pointer bg-gray-500! border-none!";

  const handleClassName =
    type === "input" ? "translate-x-1.5" : "-translate-x-1.5";

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
