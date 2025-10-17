import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Paragraph } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { hydrateComponentReference } from "@/services/componentService";
import { saveComponent } from "@/utils/localforage";

import { FullscreenElement } from "../FullscreenElement";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { PythonComponentEditor } from "./components/PythonComponentEditor";
import { YamlComponentEditor } from "./components/YamlComponentEditor";
import type { SupportedTemplate } from "./types";
import { useTemplateCodeByName } from "./useTemplateCodeByName";

const ComponentEditorDialogSkeleton = () => {
  return (
    <FullscreenElement fullscreen={true}>
      <BlockStack className="h-full w-full p-2 bg-white" align="start" gap="2">
        <InlineStack
          className="w-full h-13"
          gap="4"
          blockAlign="center"
          align="space-between"
          wrap="nowrap"
        >
          <Skeleton size="lg" />
          <Skeleton size="lg" shape="button" />
        </InlineStack>
        <Separator />
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
    </FullscreenElement>
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
    templateName?: SupportedTemplate;
    onClose: () => void;
  }) => {
    const notify = useToastNotification();
    const { addToComponentLibrary } = useComponentLibrary();

    const { data: templateCode } = useTemplateCodeByName(templateName);
    const [componentText, setComponentText] = useState(text ?? templateCode);
    const [errors, setErrors] = useState<string[]>([]);

    const { data: pythonCodeDetection } = useSuspenseQuery({
      queryKey: ["isPython", `${templateName}-${JSON.stringify(text)}`],
      queryFn: async (): Promise<PythonCodeDetection> => {
        if (text) {
          const hydratedComponent = await hydrateComponentReference({
            text,
          });

          const pythonOriginalCode = hydratedComponent?.spec?.metadata
            ?.annotations?.python_original_code as string;

          if (!pythonOriginalCode) {
            return { isPython: false };
          }

          return {
            isPython: true,
            pythonOriginalCode,
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

    const handleComponentTextChange = useCallback((value: string) => {
      setComponentText(value);
    }, []);

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
    const hasTemplate = templateName && templateName !== "empty";

    return (
      <FullscreenElement fullscreen={true}>
        <BlockStack className="h-full w-full p-2 bg-white">
          <InlineStack
            className="w-full py-3 border-b-3 border-gray-100"
            blockAlign="center"
            align="space-between"
          >
            <InlineStack gap="2" blockAlign="center">
              <Heading level={1}>{title}</Heading>
              {hasTemplate && (
                <Paragraph size="sm" tone="subdued">
                  ({templateName} template)
                </Paragraph>
              )}
            </InlineStack>

            <InlineStack gap="2" blockAlign="center">
              <Button
                variant="default"
                onClick={handleSave}
                disabled={errors.length > 0}
              >
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
              onErrorsChange={setErrors}
            />
          ) : (
            <YamlComponentEditor
              text={componentText}
              onComponentTextChange={handleComponentTextChange}
              onErrorsChange={setErrors}
            />
          )}
        </BlockStack>
      </FullscreenElement>
    );
  },
  ComponentEditorDialogSkeleton,
);
