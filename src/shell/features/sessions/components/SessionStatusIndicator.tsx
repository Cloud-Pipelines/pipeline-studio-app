import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import { StatusDot } from "@/shell/features/chat/components/sidebar/StatusDot";
import { useSessionStatus } from "@/shell/features/sessions/model/sessionStatusContext";
import { SESSION_STATUS_DISPLAY } from "@/shell/features/sessions/model/sessionStatusDisplay";

interface SessionStatusIndicatorProps {
  sessionId: string;
}

/** Live run-status dot + label for a session, driven by the lobby socket. */
export function SessionStatusIndicator({
  sessionId,
}: SessionStatusIndicatorProps) {
  const status = useSessionStatus(sessionId);
  const { variant, label } = SESSION_STATUS_DISPLAY[status];

  return (
    <InlineStack gap="1" blockAlign="center" wrap="nowrap">
      <StatusDot variant={variant} />
      <Text size="xs" tone="subdued">
        {label}
      </Text>
    </InlineStack>
  );
}
