import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";

import { MessageActions } from "./MessageActions";

/** Formats an ISO-8601 timestamp as a short local time, e.g. `07:35 PM`. */
function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageHeaderProps {
  authorName: string;
  roleLabel: string;
  createdAt: string;
  content: string;
  onCollapse?: () => void;
}

export function MessageHeader({
  authorName,
  roleLabel,
  createdAt,
  content,
  onCollapse,
}: MessageHeaderProps) {
  return (
    <InlineStack align="start" blockAlign="center" gap="2" wrap="nowrap">
      <Text size="xs" weight="medium" tone="subdued">
        {authorName}
        {roleLabel}
        {" · "}
        {formatMessageTime(createdAt)}
      </Text>
      <MessageActions content={content} onCollapse={onCollapse} />
    </InlineStack>
  );
}
