import MonacoEditor from "@monaco-editor/react";
import { useCallback, useState } from "react";

import { TaskNodeCard } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";

import { usePreviewTaskNodeData } from "../usePreviewTaskNodeData";
import { PointersEventBlock } from "./PointersEventBlock";

export const YamlComponentEditor = withSuspenseWrapper(
  ({
    text,
    onComponentTextChange,
  }: {
    text: string;
    onComponentTextChange: (yaml: string) => void;
  }) => {
    const [componentText, setComponentText] = useState(text);

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
        onComponentTextChange(value ?? "");
      },
      [onComponentTextChange],
    );

    const previewNodeData = usePreviewTaskNodeData(componentText);

    return (
      <InlineStack className="w-full h-full" gap="4">
        <BlockStack className="flex-1 h-full pt-7">
          <MonacoEditor
            defaultLanguage={"yaml"}
            theme="vs-dark"
            value={componentText}
            onChange={handleComponentTextChange}
            options={{
              minimap: {
                enabled: false,
              },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </BlockStack>

        <BlockStack className="flex-1 h-full">
          <BlockStack className="w-full h-full">
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
            >
              {previewNodeData ? (
                <PointersEventBlock>
                  <TaskNodeProvider
                    data={previewNodeData}
                    selected={false}
                    runStatus={undefined}
                  >
                    <TaskNodeCard />
                  </TaskNodeProvider>
                </PointersEventBlock>
              ) : null}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);
