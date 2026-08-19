import { observer } from "mobx-react-lite";

import { LinkNodeButton } from "@/components/shared/Buttons/LinkNodeButton";
import { ActionBlock } from "@/components/shared/ContextPanel/Blocks/ActionBlock";
import { CopyText } from "@/components/shared/CopyText/CopyText";
import IOCell from "@/components/shared/ReactFlow/FlowCanvas/TaskNode/TaskOverview/IOSection/IOCell/IOCell";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import { useExecutionArtifacts } from "@/hooks/useExecutionArtifacts";
import { useExecutionDataOptional } from "@/providers/ExecutionDataProvider";
import { useSpec } from "@/routes/v2/shared/providers/SpecContext";
import { tracking } from "@/utils/tracking";

interface RunViewOutputDetailsProps {
  entityId: string;
}

export const RunViewOutputDetails = observer(function RunViewOutputDetails({
  entityId,
}: RunViewOutputDetailsProps) {
  const spec = useSpec();
  const executionData = useExecutionDataOptional();
  const output = spec?.outputs.find((o) => o.$id === entityId);

  const rootExecutionId = executionData?.rootExecutionId;
  const { data: artifacts, isLoading: isLoadingArtifacts } =
    useExecutionArtifacts(rootExecutionId);

  if (!output) {
    return (
      <BlockStack className="p-4">
        <Text size="sm" tone="subdued">
          Output not found
        </Text>
      </BlockStack>
    );
  }

  const type = output.type ? String(output.type) : undefined;
  const artifact = artifacts?.output_artifacts?.[output.name];

  return (
    <BlockStack
      gap="4"
      className="h-full px-2"
      data-context-panel="output-overview"
    >
      <InlineStack gap="2" blockAlign="center">
        <Icon name="Upload" size="sm" className="text-green-500 shrink-0" />
        <CopyText size="lg" className="font-semibold wrap-anywhere">
          {output.name}
        </CopyText>
      </InlineStack>

      <ActionBlock
        actions={[
          <LinkNodeButton
            key="link"
            nodeId={output.name}
            {...tracking("v2.run_view.context_panel.output_link_share")}
          />,
        ]}
      />

      <BlockStack gap="4" className="p-1">
        {type && (
          <BlockStack gap="1">
            <Text size="xs" tone="subdued" weight="semibold">
              Type
            </Text>
            <CopyText size="sm" className="font-mono">
              {type}
            </CopyText>
          </BlockStack>
        )}

        {output.description && (
          <BlockStack gap="1">
            <Text size="xs" tone="subdued" weight="semibold">
              Description
            </Text>
            <CopyText size="sm">{output.description}</CopyText>
          </BlockStack>
        )}

        {rootExecutionId && (
          <BlockStack gap="1">
            <Text size="xs" tone="subdued" weight="semibold">
              Value
            </Text>
            {isLoadingArtifacts ? (
              <InlineStack gap="2" blockAlign="center">
                <Spinner />
                <Text size="sm" tone="subdued">
                  Loading artifact…
                </Text>
              </InlineStack>
            ) : (
              <IOCell name={output.name} type={type} artifact={artifact} />
            )}
          </BlockStack>
        )}
      </BlockStack>
    </BlockStack>
  );
});
