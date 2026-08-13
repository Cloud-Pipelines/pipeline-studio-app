import { InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import type { AgentActivity } from "@/shell/contracts";

import { MessageAvatar } from "./MessageAvatar";
import { MessageLayout } from "./MessageLayout";

interface AgentActivityBubbleProps {
  activity: AgentActivity;
}

const SPINNER_SIZE = 14;

/**
 * Ephemeral leaf bubble showing what the agent is doing between messages (a
 * running tool, or "thinking"). Rendered only while the run is busy and no
 * message is streaming; it is never persisted and disappears as soon as the
 * next message arrives.
 */
export function AgentActivityBubble({ activity }: AgentActivityBubbleProps) {
  return (
    <MessageLayout
      variant="agent"
      avatar={<MessageAvatar kind="agent" name="Prime" agentRole="prime" />}
    >
      <InlineStack gap="2" blockAlign="center" wrap="nowrap">
        <Spinner size={SPINNER_SIZE} />
        <Text size="sm" tone="subdued">
          {activity.label}
        </Text>
      </InlineStack>
    </MessageLayout>
  );
}
