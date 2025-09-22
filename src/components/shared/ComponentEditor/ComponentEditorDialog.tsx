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
    const handleClose = useCallback(() => {
      onClose(dummyComponentText);
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
                defaultLanguage={"yaml"}
                theme="vs-dark"
                defaultValue={dummyComponentText}
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
