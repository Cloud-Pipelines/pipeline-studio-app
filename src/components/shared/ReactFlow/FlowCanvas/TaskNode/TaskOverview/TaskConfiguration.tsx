import { useCallback } from "react";

import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Switch } from "@/components/ui/switch";
import { Heading, Paragraph } from "@/components/ui/typography";
import { type TaskNodeContextType } from "@/providers/TaskNodeProvider";
import { isCacheDisabled } from "@/utils/cache";
import { ISO8601_DURATION_ZERO_DAYS } from "@/utils/constants";

interface TaskConfigurationProps {
  taskNode: TaskNodeContextType;
}

const TaskConfiguration = ({ taskNode }: TaskConfigurationProps) => {
  const { taskSpec, callbacks } = taskNode;

  const disabledCache = isCacheDisabled(taskSpec);

  const handleDisableCacheChange = useCallback(
    (checked: boolean) => {
      callbacks.setCacheStaleness(
        checked ? ISO8601_DURATION_ZERO_DAYS : undefined,
      );
    },
    [callbacks],
  );

  return (
    <BlockStack gap="2">
      <Heading level={1}>Configuration</Heading>
      <InlineStack align="space-between" gap="2" className="w-full">
        <Paragraph tone="subdued" size="sm">
          Disable cache
        </Paragraph>
        <Switch
          checked={disabledCache}
          onCheckedChange={handleDisableCacheChange}
        />
      </InlineStack>
    </BlockStack>
  );
};

export default TaskConfiguration;
