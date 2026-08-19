import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { useThinkingCollapse } from "@/shell/features/chat/hooks/useThinkingCollapse";
import { isThinkingDone } from "@/shell/features/chat/model/messageState";
import type { ChatMessage as ChatMessageType } from "@/shell/features/chat/model/types";
import { Markdown } from "@/shell/lib/markdown/Markdown";

import { HeaderCollapseButton } from "./HeaderCollapseButton";
import { MessageAvatar } from "./MessageAvatar";
import { MessageLayout } from "./MessageLayout";
import type { ShellMessageBubbleVariant } from "./ShellMessageBubble";

interface ThinkingOnlyMessageProps {
  message: ChatMessageType;
  variant: ShellMessageBubbleVariant;
  roleLabel: string;
  isStreaming: boolean;
  onCollapse?: () => void;
}

export function ThinkingOnlyMessage({
  message,
  variant,
  roleLabel,
  isStreaming,
  onCollapse,
}: ThinkingOnlyMessageProps) {
  const thinkingDone = isThinkingDone(message, isStreaming);
  const { open } = useThinkingCollapse(thinkingDone);

  return (
    <MessageLayout
      variant={variant}
      selectable={open}
      avatar={
        <MessageAvatar
          kind={message.author.kind}
          name={message.author.name}
          agentRole={message.author.agentRole}
        />
      }
      header={
        <InlineStack align="start" blockAlign="center" gap="2" wrap="nowrap">
          <Text size="xs" weight="medium" tone="subdued">
            {message.author.name}
            {roleLabel}
          </Text>
          <HeaderCollapseButton onCollapse={onCollapse} />
        </InlineStack>
      }
    >
      <Markdown size="xs" tone="subdued">
        {message.thinking ?? ""}
      </Markdown>
    </MessageLayout>
  );
}
