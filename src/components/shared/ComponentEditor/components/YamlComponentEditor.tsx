import MonacoEditor from "@monaco-editor/react";
import { useCallback, useState } from "react";

import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";

import { DEFAULT_MONACO_OPTIONS } from "../constants";
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

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
        onComponentTextChange(value ?? "");
      },
      [onComponentTextChange],
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
          <BlockStack className="w-full h-full">
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
            >
              <PreviewTaskNodeCard componentText={componentText} />
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);
