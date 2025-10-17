import MonacoEditor from "@monaco-editor/react";
import { useCallback, useState } from "react";

import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";

import { InfoBox } from "../../InfoBox";
import { DEFAULT_MONACO_OPTIONS } from "../constants";
import { useComponentSpecValidator } from "../useComponentSpecValidator";
import { PreviewTaskNodeCard } from "./PreviewTaskNodeCard";

export const YamlComponentEditor = withSuspenseWrapper(
  ({
    text,
    onComponentTextChange,
  }: {
    text: string;
    onComponentTextChange: (yaml: string) => void;
  }) => {
    const [componentText, setComponentText] = useState(text);
    const validateComponentSpec = useComponentSpecValidator();
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        const validationResult = validateComponentSpec(value ?? "");

        if (!validationResult.valid) {
          setValidationErrors(
            validationResult.errors ?? ["Invalid component spec"],
          );
          return;
        }

        setComponentText(value ?? "");
        onComponentTextChange(value ?? "");
        setValidationErrors([]);
      },
      [onComponentTextChange, validateComponentSpec],
    );

    return (
      <InlineStack className="w-full h-full" gap="4">
        <BlockStack className="flex-1 h-full pt-7" data-testid="yaml-editor">
          <MonacoEditor
            defaultLanguage={"yaml"}
            theme="vs-dark"
            value={componentText}
            onChange={handleComponentTextChange}
            options={DEFAULT_MONACO_OPTIONS}
          />
        </BlockStack>

        <BlockStack className="flex-1 h-full" data-testid="yaml-editor-preview">
          <BlockStack className="h-full">
            <BlockStack className="h-full" align="center" inlineAlign="center">
              {validationErrors.length > 0 ? (
                <InfoBox
                  variant="error"
                  title="Invalid component spec"
                  className="w-[280px]"
                >
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </InfoBox>
              ) : (
                <PreviewTaskNodeCard componentText={componentText} />
              )}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);
