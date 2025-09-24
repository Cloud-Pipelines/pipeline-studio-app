import MonacoEditor from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";

import { TaskNodeCard } from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";

import { usePythonYamlGenerator } from "../generators/python";
import { usePreviewTaskNodeData } from "../usePreviewTaskNodeData";
import { TogglePreview } from "./TogglePreview";

/**
 * A dialog for editing a Python function.
 */
export const PythonComponentEditor = withSuspenseWrapper(
  ({
    text,
    onComponentTextChange,
  }: {
    text: string;
    onComponentTextChange: (yaml: string) => void;
  }) => {
    const [componentText, setComponentText] = useState("");
    const [showPreview, setShowPreview] = useState(true);
    const yamlGenerator = usePythonYamlGenerator();

    const handleFunctionTextChange = useCallback(
      async (value: string | undefined) => {
        const yaml = await yamlGenerator(value ?? "").catch((error) => {
          return `❌ Error In Component Code ❌ \n\n ${error instanceof Error ? error.message : String(error)}`;
        });
        setComponentText(yaml);
        onComponentTextChange(yaml);
      },
      [yamlGenerator, onComponentTextChange],
    );

    useEffect(() => {
      // first time loading
      handleFunctionTextChange(text);
    }, [text, handleFunctionTextChange]);

    const previewNodeData = usePreviewTaskNodeData(componentText);

    return (
      <InlineStack className="w-full h-full" gap="4">
        <BlockStack className="flex-1 h-full pt-7">
          <MonacoEditor
            defaultLanguage={"python"}
            theme="vs-dark"
            value={text}
            onChange={handleFunctionTextChange}
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
            <TogglePreview
              showPreview={showPreview}
              setShowPreview={setShowPreview}
            />
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
            >
              {previewNodeData && showPreview && (
                <TaskNodeProvider
                  data={previewNodeData}
                  selected={false}
                  runStatus={undefined}
                  preview
                >
                  <TaskNodeCard />
                </TaskNodeProvider>
              )}
              {!showPreview && (
                <MonacoEditor
                  defaultLanguage={"yaml"}
                  theme="vs-dark"
                  value={componentText}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                  }}
                />
              )}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);
