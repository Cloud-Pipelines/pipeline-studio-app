import { Handle, Position } from "@xyflow/react";
import { memo, useEffect, useMemo } from "react";

import { InputValueEditor } from "@/components/Editor/IOEditor/InputValueEditor";
import { OutputNameEditor } from "@/components/Editor/IOEditor/OutputNameEditor";
import { getOutputConnectedDetails } from "@/components/Editor/utils/getOutputConnectedDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Paragraph } from "@/components/ui/typography";
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
    readOnly?: boolean;
  };
  selected: boolean;
  deletable: boolean;
}

const IONode = ({ type, data, selected = false }: IONodeProps) => {
  const { graphSpec, componentSpec } = useComponentSpec();
  const { setContent } = useContextPanel();

  const isInput = type === "input";
  const isOutput = type === "output";

  const readOnly = !!data.readOnly;

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

  useEffect(() => {
    if (selected) {
      if (input && isInput) {
        setContent(
          <InputValueEditor
            input={input}
            key={input.name}
            disabled={readOnly}
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
            disabled={readOnly}
          />,
        );
      }
    }
  }, [input, output, selected, readOnly]);

  const connectedOutput = getOutputConnectedDetails(graphSpec, data.label);
  const outputConnectedValue = connectedOutput.outputName;
  const outputConnectedType = connectedOutput.outputType;
  const outputConnectedTaskId = connectedOutput.taskId;

  const handleDefaultClassName =
    "!w-[12px] !h-[12px] !border-0 !transform-none !bg-gray-500";

  const handleClassName = isInput ? "translate-x-1.5" : "-translate-x-1.5";

  const hasDataValue = !!data.value;
  const hasDataDefault = !!data.default;

  const inputValue = hasDataValue
    ? data.value
    : hasDataDefault
      ? data.default
      : null;

  const outputValue = outputConnectedValue ?? null;

  const value = isInput ? inputValue : outputValue;

  return (
    <Card className={cn("border-2 max-w-[300px] p-0", borderColor)}>
      <CardHeader className="px-2 py-2.5">
        <CardTitle className="break-words">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 max-w-[250px]">
        <BlockStack gap="2">
          {/* type */}
          <Paragraph size="xs" font="mono" className="truncate text-slate-700">
            <span className="font-bold">Type:</span>{" "}
            {outputConnectedType ?? data.type ?? "Any"}
          </Paragraph>

          {!!outputConnectedTaskId && (
            <Paragraph weight="bold" className="text-slate-700">
              {outputConnectedTaskId}
            </Paragraph>
          )}

          {/* value */}
          <InlineStack gap="1" className="p-2 bg-white rounded-lg w-full">
            <Paragraph
              size="xs"
              font="mono"
              weight="bold"
              className="text-slate-700"
            >
              Value:
            </Paragraph>
            <Paragraph
              size="xs"
              font="mono"
              tone={!value ? "critical" : "subdued"}
              className="truncate"
            >
              {value ?? "No value"}
            </Paragraph>
          </InlineStack>
        </BlockStack>
        <Handle
          type={handleType}
          position={handlePosition}
          className={cn(handleDefaultClassName, handleClassName)}
        />
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
