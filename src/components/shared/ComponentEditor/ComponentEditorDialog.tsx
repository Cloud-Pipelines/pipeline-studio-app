import MonacoEditor from "@monaco-editor/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Paragraph } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentReference } from "@/utils/componentSpec";
import { saveComponent } from "@/utils/localforage";
import { generateTaskSpec } from "@/utils/nodes/generateTaskSpec";

import { FullscreenElement } from "../FullscreenElement";
import { TaskNodeCard } from "../ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { usePythonYamlGenerator } from "./generators/python";
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
            ? "text-bold"
            : "hover:no-underline text-blue-400 disabled:opacity-100",
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
            ? "hover:no-underline text-blue-400 disabled:opacity-100"
            : "text-bold",
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

const usePreviewTaskNodeData = (componentText: string) => {
  const [componentRef, setComponentRef] = useState<
    ComponentReference | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    hydrateComponentReference({ text: componentText }).then((ref) => {
      if (!cancelled && ref) setComponentRef(ref);
    });
    return () => {
      cancelled = true;
    };
  }, [componentText]);

  return useMemo(() => {
    if (!componentRef) return undefined;

    return generatePreviewTaskNodeData(componentRef);
  }, [componentRef]);
};

const defaultPythonFunctionText = `from cloud_pipelines import components

def filter_text(
    # The InputPath() annotation makes the system pass a local input path where the function can read the input data.
    text_path: components.InputPath(),
    # The OutputPath() annotation makes the system pass a local output path where the function should write the output data.
    filtered_text_path: components.OutputPath(),
    pattern: str = ".*",
):
    """Filters text.

    Filtering is performed using regular expressions.

    Args:
        text_path: The source text
        pattern: The regular expression pattern
        filtered_text_path: The filtered text
    """
    # Function must be self-contained.
    # So all import statements must be inside the function.
    import os
    import re

    regex = re.compile(pattern)

    os.makedirs(os.path.dirname(filtered_text_path), exist_ok=True)
    with open(text_path, "r") as reader:
        with open(filtered_text_path, "w") as writer:
            for line in reader:
                if regex.search(line):
                    writer.write(line)
`;

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

    const previewNodeData = usePreviewTaskNodeData(componentText);

    return (
      <InlineStack className="w-full h-full" gap="4">
        <BlockStack className="flex-1 h-full pt-7">
          <MonacoEditor
            defaultLanguage={"yaml"}
            theme="vs-dark"
            value={componentText}
            onChange={handleComponentTextChange}
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
            <BlockStack
              className="w-full h-full"
              align="center"
              inlineAlign="center"
            >
              {previewNodeData ? (
                <TaskNodeProvider
                  data={previewNodeData}
                  selected={false}
                  runStatus={undefined}
                  preview
                >
                  <TaskNodeCard />
                </TaskNodeProvider>
              ) : null}
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </InlineStack>
    );
  },
);

type PythonCodeDetection =
  | { isPython: true; pythonOriginalCode: string }
  | { isPython: false };

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

        return templateName === "python"
          ? { isPython: true, pythonOriginalCode: defaultPythonFunctionText }
          : { isPython: false };
      },
    });

    const handleComponentTextChange = useCallback(
      (value: string | undefined) => {
        setComponentText(value ?? "");
      },
      [],
    );

    const handleSave = async () => {
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
        onSave(componentText);
      }
    };

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
