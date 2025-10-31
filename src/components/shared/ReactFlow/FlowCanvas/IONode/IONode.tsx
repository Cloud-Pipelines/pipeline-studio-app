import { Handle, Position } from "@xyflow/react";
import { memo, useEffect, useMemo } from "react";

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
import { isInputSpec, typeSpecToString } from "@/utils/componentSpec";

interface IONodeProps {
  type: "input" | "output";
  data: IONodeData;
  selected: boolean;
  deletable: boolean;
}

const IONode = ({ type, data, selected = false }: IONodeProps) => {
  const { currentGraphSpec, currentSubgraphSpec } = useComponentSpec();
  const { setContent, clearContent } = useContextPanel();
  const { getHandleNodeId } = useNodeManager();

  const { spec, readOnly } = data;

  const isInput = isInputSpec(spec, type);

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
    () => currentSubgraphSpec.inputs?.find((input) => input.name === spec.name),
    [currentSubgraphSpec.inputs, spec.name],
  );

  const output = useMemo(
    () =>
      currentSubgraphSpec.outputs?.find((output) => output.name === spec.name),
    [currentSubgraphSpec.outputs, spec.name],
  );

  const handleNodeType = isInput ? "handle-out" : "handle-in";
  const nodeHandleId = getHandleNodeId(spec.name, spec.name, handleNodeType);

  useEffect(() => {
    if (selected) {
      if (input && isInput) {
        setContent(<InputValueEditor input={input} disabled={readOnly} />);
      }

      if (output && !isInput) {
        const outputConnectedDetails = getOutputConnectedDetails(
          currentGraphSpec,
          output.name,
        );
        setContent(
          <OutputNameEditor
            output={output}
            connectedDetails={outputConnectedDetails}
            disabled={readOnly}
          />,
        );
      }
    }
  }, [selected, readOnly, input, output, isInput, currentGraphSpec]);

  useEffect(() => {
    return () => {
      clearContent();
    };
  }, []);

  const connectedOutput = getOutputConnectedDetails(
    currentGraphSpec,
    spec.name,
  );
  const outputConnectedValue = connectedOutput.outputName;
  const outputConnectedType = connectedOutput.outputType;
  const outputConnectedTaskId = connectedOutput.taskId;

  const handleDefaultClassName =
    "!w-[12px] !h-[12px] !border-0 !transform-none !bg-gray-500";

  const handleClassName = isInput ? "translate-x-1.5" : "-translate-x-1.5";

  const inputValue = isInput ? spec.value || spec.default || null : null;
  const outputValue = outputConnectedValue ?? null;
  const value = isInput ? inputValue : outputValue;

  const typeValue = isInput
    ? typeSpecToString(spec.type)
    : typeSpecToString(outputConnectedType);

  return (
    <Card className={cn("border-2 max-w-[300px] p-0", borderColor)}>
      <CardHeader className="px-2 py-2.5">
        <CardTitle className="break-words">{spec.name}</CardTitle>
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
          id={nodeHandleId}
          type={handleType}
          position={handlePosition}
          className={cn(handleDefaultClassName, handleClassName)}
        />
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
