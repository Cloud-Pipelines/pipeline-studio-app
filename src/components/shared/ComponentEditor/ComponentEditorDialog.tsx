import MonacoEditor from "@monaco-editor/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Paragraph } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentReference } from "@/utils/componentSpec";
import { generateTaskSpec } from "@/utils/nodes/generateTaskSpec";

import { FullscreenElement } from "../FullscreenElement";
import { TaskNodeCard } from "../ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { useTemplateCodeByName } from "./useTemplateCodeByName";

const TogglePreview = ({
  showPreview,
  setShowPreview,
}: {
  showPreview: boolean;
  setShowPreview: (showPreview: boolean) => void;
}) => {
  return (
    <InlineStack gap="1" blockAlign="center">
      <Paragraph>Preview:</Paragraph>
      <Button
        variant="link"
        className={cn(
          showPreview
            ? "hover:no-underline text-blue-400 disabled:opacity-100"
            : "text-muted-foreground",
        )}
        onClick={() => setShowPreview(true)}
        disabled={showPreview}
      >
        Card
      </Button>
      <Paragraph>|</Paragraph>
      <Button
        variant="link"
        className={cn(
          showPreview
            ? "text-muted-foreground"
            : "hover:no-underline text-blue-400 disabled:opacity-100",
        )}
        onClick={() => setShowPreview(false)}
        disabled={!showPreview}
      >
        YAML
      </Button>
    </InlineStack>
  );
};

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
  ({
    text,
    templateName = "empty",
    onSave,
    onClose,
  }: {
    text?: string;
    templateName?: string;
    onSave: (componentText: string) => void;
    onClose: () => void;
  }) => {
    const { data: templateCode } = useTemplateCodeByName(templateName);
    const [showPreview, setShowPreview] = useState(true);

    const [componentText, setComponentText] = useState(text ?? templateCode);

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
      },
      [],
    );

    const [componentRef, setComponentRef] = useState<
      ComponentReference | undefined
    >(undefined);

    const previewNodeData = useMemo(() => {
      if (!componentRef) return undefined;

      return generatePreviewTaskNodeData(componentRef);
    }, [componentRef]);

    const handleSave = useCallback(() => {
      onSave(componentText);
    }, [onSave, componentText]);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    useEffect(() => {
      let cancelled = false;
      hydrateComponentReference({ text: componentText }).then((ref) => {
        if (!cancelled && ref) setComponentRef(ref);
      });
      return () => {
        cancelled = true;
      };
    }, [componentText]);

    const title = text ? "Edit Component" : "New Component";

    return (
      <FullscreenElement fullscreen={true}>
        <BlockStack className="h-full w-full p-2 bg-white">
          <InlineStack
            className="w-full py-3 px-4 border-b-3 border-gray-100"
            blockAlign="center"
            align="space-between"
          >
            <InlineStack gap="2" blockAlign="center">
              <Heading level={1}>{title}</Heading>
              {templateName !== "empty" && (
                <Paragraph size="sm" tone="subdued">
                  {`(${templateName} template)`}
                </Paragraph>
              )}
            </InlineStack>
            <TogglePreview
              showPreview={showPreview}
              setShowPreview={setShowPreview}
            />
            <InlineStack gap="2" blockAlign="center">
              <Button variant="secondary" onClick={handleSave}>
                <Icon name="Save" /> Save
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <Icon name="X" />
              </Button>
            </InlineStack>
          </InlineStack>
          <InlineStack className="w-full h-full">
            <BlockStack className="flex-1 h-full">
              <MonacoEditor
                defaultLanguage={"yaml"}
                theme="vs-dark"
                value={componentText}
                onChange={handleComponentTextChange}
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
              <BlockStack
                align="center"
                inlineAlign="center"
                className="w-full h-full"
              >
                {previewNodeData && showPreview && (
                  <TaskNodeProvider
                    data={previewNodeData}
                    selected={false}
                    runStatus={undefined}
                  >
                    <TaskNodeCard />
                  </TaskNodeProvider>
                )}
                {!showPreview && (
                  <MonacoEditor
                    defaultLanguage={"yaml"}
                    theme="vs-dark"
                    value={componentText}
                    onChange={handleComponentTextChange}
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
                )}
              </BlockStack>
            </BlockStack>
          </InlineStack>
        </BlockStack>
      </FullscreenElement>
    );
  },
  ComponentEditorDialogSkeleton,
);

const generatePreviewTaskNodeData = (
  componentRef: ComponentReference,
  taskId?: string,
): TaskNodeData => {
  const previewTaskId =
    taskId ||
    `preview-${componentRef.name ?? componentRef.spec?.name ?? "unknown"}`;
  const taskSpec = generateTaskSpec(componentRef);

  return {
    taskSpec,
    taskId: previewTaskId,
    isGhost: false,
    readOnly: true,
  };
};
