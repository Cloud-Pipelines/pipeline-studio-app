import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Paragraph } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentReference } from "@/utils/componentSpec";
import { saveComponent } from "@/utils/localforage";
import { generateTaskSpec } from "@/utils/nodes/generateTaskSpec";

import { FullscreenElement } from "../FullscreenElement";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { PythonComponentEditor } from "./components/PythonComponentEditor";
import { YamlComponentEditor } from "./components/YamlComponentEditor";
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

type PythonCodeDetection =
  | { isPython: true; pythonOriginalCode: string }
  | { isPython: false };

export const ComponentEditorDialog = withSuspenseWrapper(
  ({
    text,
    templateName = "empty",
    onClose,
  }: {
    text?: string;
    templateName?: string;
    onClose: () => void;
  }) => {
    const notify = useToastNotification();
    const { addToComponentLibrary } = useComponentLibrary();

    const { data: templateCode } = useTemplateCodeByName(templateName);
    const [componentText, setComponentText] = useState(text ?? templateCode);

    const { data: pythonCodeDetection } = useSuspenseQuery({
      queryKey: ["isPython", `${templateName}-${JSON.stringify(text)}`],
      queryFn: async (): Promise<PythonCodeDetection> => {
        if (text) {
          const hydratedComponent = await hydrateComponentReference({
            text,
          });

          if (
            !hydratedComponent?.spec?.metadata?.annotations
              ?.python_original_code
          ) {
            return { isPython: false };
          }

          return {
            isPython: true,
            pythonOriginalCode: hydratedComponent?.spec?.metadata?.annotations
              ?.python_original_code as string,
          };
        }

        if (templateName !== "python") {
          return { isPython: false };
        }

        const defaultPythonFunctionText = await import(
          `./templates/python_function.py?raw`
        ).then((module) => module.default);

        return {
          isPython: true,
          pythonOriginalCode: defaultPythonFunctionText,
        };
      },
    });

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
      },
      [],
    );

    const handleSave = useCallback(async () => {
      const hydratedComponent = await hydrateComponentReference({
        text: componentText,
      });

      if (hydratedComponent) {
        await saveComponent({
          id: `component-${hydratedComponent.digest}`,
          url: "",
          data: componentText,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        addToComponentLibrary(hydratedComponent);

        onClose();

        notify(
          `Component ${hydratedComponent.name} imported successfully`,
          "success",
        );
      }
    }, [componentText, addToComponentLibrary, notify, onClose]);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

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

            <InlineStack gap="2" blockAlign="center">
              <Button variant="secondary" onClick={handleSave}>
                <Icon name="Save" /> Save
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <Icon name="X" />
              </Button>
            </InlineStack>
          </InlineStack>

          {pythonCodeDetection?.isPython ? (
            <PythonComponentEditor
              text={pythonCodeDetection.pythonOriginalCode}
              onComponentTextChange={handleComponentTextChange}
            />
          ) : (
            <YamlComponentEditor
              text={componentText}
              onComponentTextChange={handleComponentTextChange}
            />
          )}
        </BlockStack>
      </FullscreenElement>
    );
  },
  ComponentEditorDialogSkeleton,
);

export const generatePreviewTaskNodeData = (
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
