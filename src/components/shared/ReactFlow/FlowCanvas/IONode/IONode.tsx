import { Handle, Position } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo } from "react";

import { InputValueEditor } from "@/components/Editor/IOEditor/InputValueEditor";
import { OutputNameEditor } from "@/components/Editor/IOEditor/OutputNameEditor";
import { getOutputConnectedDetails } from "@/components/Editor/utils/getOutputConnectedDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Paragraph } from "@/components/ui/typography";
import { useNodeManager } from "@/hooks/useNodeManager";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import type { IONodeData } from "@/types/nodes";
import type { InputSpec, TypeSpecType } from "@/utils/componentSpec";
import { ENABLE_DEBUG_MODE } from "@/utils/constants";
import {
  inputNameToInputId,
  outputNameToOutputId,
} from "@/utils/nodes/conversions";

interface IONodeProps {
  type: "input" | "output";
  data: IONodeData;
  selected: boolean;
  deletable: boolean;
}

const IONode = ({ type, data, selected = false }: IONodeProps) => {
  const { getInputNodeId, getOutputNodeId } = useNodeManager();
  const { graphSpec, componentSpec } = useComponentSpec();
  const { setContent, clearContent } = useContextPanel();

  const { spec, readOnly } = data;

  const isInput = type === "input";
  const isOutput = type === "output";

  const inputSpec = isInput ? (spec as InputSpec) : null;

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
    () => componentSpec.inputs?.find((input) => input.name === spec.name),
    [componentSpec.inputs, spec.name],
  );

  const output = useMemo(
    () => componentSpec.outputs?.find((output) => output.name === spec.name),
    [componentSpec.outputs, spec.name],
  );

  const nodeId = isInput
    ? getInputNodeId(inputNameToInputId(spec.name))
    : getOutputNodeId(outputNameToOutputId(spec.name));

  const nodeHandleId = `${nodeId}_handle`;

  const handleHandleClick = useCallback(() => {
    if (ENABLE_DEBUG_MODE) {
      console.log(`${isInput ? "Input" : "Output"} Node Handle clicked:`, {
        name: isInput ? input?.name : output?.name,
        nodeId,
        handleId: nodeHandleId,
      });
    }
  }, [isInput, input, output, nodeId, nodeHandleId]);

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

    return () => {
      if (selected) {
        clearContent();
      }
    };
  }, [input, output, selected, readOnly]);

  const connectedOutput = getOutputConnectedDetails(graphSpec, spec.name);
  const outputConnectedValue = connectedOutput.outputName;
  const outputConnectedType = connectedOutput.outputType;
  const outputConnectedTaskId = connectedOutput.taskId;

  const handleDefaultClassName =
    "!w-[12px] !h-[12px] !border-0 !transform-none !bg-gray-500";

  const handleClassName = isInput ? "translate-x-1.5" : "-translate-x-1.5";

  const inputValue = inputSpec?.value
    ? inputSpec?.value
    : inputSpec?.default
      ? inputSpec?.default
      : null;
  const outputValue = outputConnectedValue ?? null;
  const value = isInput ? inputValue : outputValue;

  const inputType = getTypeDisplayString(inputSpec?.type);
  const outputType = getTypeDisplayString(outputConnectedType);
  const typeValue = isInput ? inputType : outputType;

  return (
    <Card className={cn("border-2 max-w-[300px] p-0", borderColor)}>
      <CardHeader className="px-2 py-2.5">
        <CardTitle className="break-words">{spec.name}</CardTitle>
        {ENABLE_DEBUG_MODE && (
          <Paragraph size="xs" tone="subdued">
            Node Id: {nodeId}
          </Paragraph>
        )}
      </CardHeader>
      <CardContent className="p-2 max-w-[250px]">
        <BlockStack gap="2">
          {/* type */}
          <Paragraph size="xs" font="mono" className="truncate text-slate-700">
            <span className="font-bold">Type:</span> {typeValue}
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
          onClick={handleHandleClick}
        />
      </CardContent>
    </Card>
  );
};

export default memo(IONode);

const getTypeDisplayString = (type: TypeSpecType | undefined): string => {
  if (!type) return "Any";

  if (typeof type === "string") {
    return type;
  }

  return JSON.stringify(type);
};
