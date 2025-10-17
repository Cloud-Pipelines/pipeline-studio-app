import MonacoEditor from "@monaco-editor/react";
import { useCallback, useEffect, useState } from "react";

import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/typography";

import { InfoBox } from "../../InfoBox";
import { DEFAULT_MONACO_OPTIONS } from "../constants";
import { usePythonYamlGenerator } from "../generators/python";
import { PreviewTaskNodeCard } from "./PreviewTaskNodeCard";
import { TogglePreview } from "./TogglePreview";

const PythonComponentEditorSkeleton = () => {
  return (
    <BlockStack className="h-full w-full p-2 bg-white" align="start" gap="2">
      <InlineStack
        className="w-full h-full flex-1"
        gap="4"
        blockAlign="start"
        align="space-between"
        wrap="nowrap"
      >
        <BlockStack gap="2" align="start" className="flex-1">
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
        </BlockStack>
        <BlockStack gap="2" align="start" className="flex-1">
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
        </BlockStack>
      </InlineStack>
    </BlockStack>
  );
};

/**
 * A dialog for editing a Python function.
 */
export const PythonComponentEditor = withSuspenseWrapper(
  ({
    text,
    onComponentTextChange,
    onErrorsChange,
  }: {
    text: string;
    onComponentTextChange: (yaml: string) => void;
    onErrorsChange: (errors: string[]) => void;
  }) => {
    const [componentText, setComponentText] = useState("");
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(true);
    const yamlGenerator = usePythonYamlGenerator();

    const handleFunctionTextChange = useCallback(
      async (value: string | undefined) => {
        try {
          const yaml = await yamlGenerator(value ?? "");
          setComponentText(yaml);
          onComponentTextChange(yaml);
          setValidationErrors([]);
          onErrorsChange([]);
        } catch (error) {
          const errors = [
            error instanceof Error ? error.message : String(error),
          ];
          onErrorsChange(errors);
          setValidationErrors(errors);
        }
      },
      [yamlGenerator, onComponentTextChange],
    );

    useEffect(() => {
      // first time loading
      handleFunctionTextChange(text);
    }, [text, handleFunctionTextChange]);

    return (
      <InlineStack className="w-full h-full" gap="4">
        <BlockStack className="flex-1 h-full" data-testid="python-editor">
          <InlineStack className="h-10 py-2">
            <Text>Python Code</Text>
          </InlineStack>
          <MonacoEditor
            defaultLanguage="python"
            theme="vs-dark"
            value={text}
            onChange={handleFunctionTextChange}
            options={DEFAULT_MONACO_OPTIONS}
          />
        </BlockStack>

        <BlockStack className="flex-1 h-full">
          <BlockStack className="w-full h-full">
            <InlineStack className="h-10 py-1">
              <TogglePreview
                showPreview={showPreview}
                setShowPreview={setShowPreview}
              />
            </InlineStack>
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
              data-testid="python-editor-preview"
            >
              {validationErrors.length > 0 ? (
                <BlockStack className="m-4" align="center" inlineAlign="center">
                  <InfoBox
                    variant="error"
                    title="Invalid component spec"
                    className="w-[280px]"
                  >
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm break-words">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </InfoBox>
                </BlockStack>
              ) : showPreview ? (
                <PreviewTaskNodeCard componentText={componentText} />
              ) : (
                <MonacoEditor
                  defaultLanguage="yaml"
                  theme="vs-dark"
                  value={componentText}
                  options={{
                    ...DEFAULT_MONACO_OPTIONS,
                    readOnly: true,
                  }}
                />
              )}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
  PythonComponentEditorSkeleton,
);
