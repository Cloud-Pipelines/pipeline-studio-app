import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text } from "@/components/ui/typography";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";
import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentReference, TaskSpec } from "@/utils/componentSpec";

import CodeSyntaxHighlighter from "../CodeViewer/CodeSyntaxHighlighter";
import { FullscreenElement } from "../FullscreenElement";
import { TaskNodeCard } from "../ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
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

const dummyComponentText = `name: Filter text using Ruby
inputs:
- {name: Text}
- {name: Pattern, default: '.*'}
outputs:
- {name: Filtered text}
metadata:
  annotations:
    author: Alexey Volkov <alexey.volkov@ark-kun.com>
    canonical_location: 'https://raw.githubusercontent.com/Ark-kun/pipeline_components/master/components/sample/Ruby_script/component.yaml'
implementation:
  container:
    image: ruby:3.4.3
    command:
    - sh
    - -ec
    - |
      # This is how additional gems can be installed dynamically
      # gem install something
      # Run the rest of the command after installing the gems.
      "$0" "$@"
    - ruby
    - -e
    - |
      require 'fileutils'

      text_path = ARGV[0]
      pattern = ARGV[1]
      filtered_text_path = ARGV[2]

      regex = Regexp.new(pattern)

      # Create the directory for the output file if it doesn't exist
      FileUtils.mkdir_p(File.dirname(filtered_text_path))

      # Open the input file for reading
      File.open(text_path, 'r') do |reader|
        # Open the output file for writing
        File.open(filtered_text_path, 'w') do |writer|
          reader.each_line do |line|
            if regex.match(line)
              writer.write(line)
            end
          end
        end
      end

    - {inputPath: Text}
    - {inputValue: Pattern}
    - {outputPath: Filtered text}
`;

export const ComponentEditorDialog = withSuspenseWrapper(
  ({
    visible,
    onClose,
  }: {
    visible: boolean;
    onClose: (componentText: string) => void;
  }) => {
    const [componentRef, setComponentRef] = useState<
      ComponentReference | undefined
    >(undefined);

    const previewNodeData = useMemo(() => {
      if (!componentRef) return undefined;

      return generatePreviewTaskNodeData(componentRef);
    }, [componentRef]);

    const handleClose = useCallback(() => {
      onClose(dummyComponentText);
    }, [onClose]);

    useEffect(() => {
      let cancelled = false;
      hydrateComponentReference({ text: dummyComponentText }).then((ref) => {
        if (!cancelled && ref) setComponentRef(ref);
      });
      return () => {
        cancelled = true;
      };
    }, []);

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
              <CodeSyntaxHighlighter code={dummyComponentText} language="yaml" readOnly={false} />
            </BlockStack>
            <BlockStack className="flex-1 h-full">
              <Heading level={2}>Preview</Heading>

              <BlockStack gap="2" align="center" className="w-full p-2">
                {previewNodeData && (
                  <TaskNodeProvider
                    data={previewNodeData}
                    selected={false}
                    runStatus={undefined}
                  >
                    <TaskNodeCard />
                  </TaskNodeProvider>
                )}
              </BlockStack>
            </BlockStack>
          </div>
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
