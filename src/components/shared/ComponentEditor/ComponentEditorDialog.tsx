import MonacoEditor from "@monaco-editor/react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text } from "@/components/ui/typography";

import { FullscreenElement } from "../FullscreenElement";
import { withSuspenseWrapper } from "../SuspenseWrapper";

const ComponentEditorDialogSkeleton = () => {
  return (
    <BlockStack className="h-full" gap="3">
      <BlockStack>
        <InlineStack gap="2" align="space-between" className="w-full">
          <Skeleton size="lg" shape="button" />
          <Skeleton size="lg" shape="button" />
          <Skeleton size="lg" shape="button" />
        </InlineStack>
      </BlockStack>
      <BlockStack className="h-[40vh] mt-4" gap="2" inlineAlign="space-between">
        <BlockStack gap="2">
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
        </BlockStack>
        <BlockStack gap="2" align="end">
          <Skeleton size="lg" shape="button" />
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
};

export const ComponentEditorDialog = withSuspenseWrapper(
  ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    if (!visible) {
      return null;
    }

    return (
      <FullscreenElement fullscreen={true}>
        <BlockStack gap="3" className="h-full w-full bg-white">
          <InlineStack
            gap="3"
            className="w-full"
            blockAlign="center"
            align="space-between"
          >
            <Text>Component Editor</Text>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <Icon name="X" />
            </Button>
          </InlineStack>
          <div className="w-full flex flex-row h-full">
            <BlockStack className="flex-1 h-full">
              <MonacoEditor
                key={"Test code"} // force re-render when code changes
                defaultLanguage={"yaml"}
                theme="vs-dark"
                defaultValue={"Test code"}
                options={{
                  minimap: {
                    enabled: true,
                  },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </BlockStack>
            <BlockStack className="flex-1 h-full">
              <Heading level={2}>Preview</Heading>
            </BlockStack>
          </div>
        </BlockStack>
      </FullscreenElement>
    );
  },
  ComponentEditorDialogSkeleton,
);
