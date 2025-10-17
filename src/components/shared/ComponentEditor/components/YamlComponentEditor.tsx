import MonacoEditor from "@monaco-editor/react";
import yaml from "js-yaml";
import { useCallback, useState } from "react";

import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { BlockStack, InlineStack } from "@/components/ui/layout";

import { InfoBox } from "../../InfoBox";
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
    const [safeComponentText, setSafeComponentText] = useState(text);
    const [error, setError] = useState<string | null>(null);

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
        onComponentTextChange(value ?? "");

        try {
          yaml.load(value ?? "");
          setSafeComponentText(value ?? "");
          setError(null);
        } catch (e) {
          setError((e as Error).message);
        }
      },
      [onComponentTextChange],
    );

    return (
      <InlineStack className="w-full h-full pt-7" gap="4">
        <BlockStack className="flex-1 h-full" data-testid="yaml-editor">
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
            <div className="h-8">
              {error && (
                <InfoBox variant="error" title="Invalid YAML">
                  {error}
                </InfoBox>
              )}
            </div>
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
            >
              <PreviewTaskNodeCard componentText={safeComponentText} />
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);
