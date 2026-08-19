import "./MemoryMessage.css";

import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import type { ChatMessage as ChatMessageType } from "@/shell/features/chat/model/types";
import { Markdown } from "@/shell/lib/markdown/Markdown";

import { ClampedReveal } from "./ClampedReveal";
import { HeaderCollapseButton } from "./HeaderCollapseButton";
import { MessageAvatar } from "./MessageAvatar";
import { MessageLayout } from "./MessageLayout";

/**
 * A server-emitted "remembered" highlight: a distinct, icon-marked bubble whose
 * text is the exact fact written to memory (so the user sees ground truth, not
 * the agent's claim).
 */
interface MemoryMessageProps {
  sessionId: string;
  message: ChatMessageType;
  onCollapse?: () => void;
}

export function MemoryMessage({
  sessionId,
  message,
  onCollapse,
}: MemoryMessageProps) {
  const scope = message.memory?.scope === "global" ? "global" : "session";
  return (
    <MessageLayout
      variant="memory"
      avatar={
        <MessageAvatar
          kind={message.author.kind}
          name={message.author.name}
          agentRole={message.author.agentRole}
        />
      }
      header={
        <InlineStack align="start" blockAlign="center" gap="2" wrap="nowrap">
          <InlineStack gap="1" blockAlign="center">
            <Icon name="Brain" size="xs" tone="accent" />
            <Text size="xs" weight="medium" tone="accent">
              Remembered ({scope})
            </Text>
          </InlineStack>
          <HeaderCollapseButton onCollapse={onCollapse} />
        </InlineStack>
      }
    >
      <ClampedReveal>
        <Markdown size="sm" tone="subdued" sessionId={sessionId}>
          {message.content}
        </Markdown>
      </ClampedReveal>
    </MessageLayout>
  );
}
