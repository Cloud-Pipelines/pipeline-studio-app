import MonacoEditor from "@monaco-editor/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading } from "@/components/ui/typography";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentReference, TaskSpec } from "@/utils/componentSpec";

import { FullscreenElement } from "../FullscreenElement";
import { TaskNodeCard } from "../ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { useTemplateCodeByName } from "./useTemplateCodeByName";

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
    onSave,
    onClose,
    templateName = "empty",
  }: {
    onSave: (componentText: string) => void;
    onClose: () => void;
    templateName: string;
  }) => {
    const { data: templateCode } = useTemplateCodeByName(templateName);

    const [componentText, setComponentText] = useState(templateCode);

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

    return (
      <FullscreenElement fullscreen={true}>
        <BlockStack gap="3" className="h-full w-full p-2 bg-white">
          <InlineStack
            gap="3"
            className="w-full"
            blockAlign="center"
            align="space-between"
          >
            <Heading level={1}>New Component</Heading>
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
            <BlockStack className="flex-1 h-full p-2">
              <Heading level={2}>Component Editor</Heading>
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
            </BlockStack>
            <BlockStack className="flex-1 h-full p-2">
              <Heading level={2}>Preview</Heading>

              <BlockStack gap="2" align="center" className="w-full p-2">
                {previewNodeData && (
                  <TaskNodeProvider
                    data={previewNodeData}
                    selected={false}
                    runStatus={undefined}
                    preview
                  >
                    <TaskNodeCard />
                  </TaskNodeProvider>
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

const generateTaskSpec = (componentRef: ComponentReference): TaskSpec => {
  return {
    componentRef,
    annotations: {
      "editor.position.x": "0",
      "editor.position.y": "0",
    } as { [k: string]: unknown },
  };
};

const generatePreviewTaskNodeData = (
  componentRef: ComponentReference,
  taskId?: string,
): TaskNodeData => {
  const previewTaskId =
    taskId || `${componentRef.name ?? componentRef.spec?.name ?? "unknown"}`;
  const taskSpec = generateTaskSpec(componentRef);

  return {
    taskSpec,
    taskId: previewTaskId,
    isGhost: false,
    readOnly: true,
  };
};
