import { InlineStack } from "@/components/ui/layout";
import { Pill } from "@/components/ui/patterns/pill";
import { Text } from "@/components/ui/typography";
import type { Session } from "@/shell/contracts";
import { useSessionStatus } from "@/shell/features/sessions/model/sessionStatusContext";

interface SessionActivityCellProps {
  session: Session;
}

/** Per-session activity badge: needs-attention, working, or task-complete. */
export function SessionActivityCell({ session }: SessionActivityCellProps) {
  const runStatus = useSessionStatus(session.id);
  const {
    unreadCount = 0,
    hasError = false,
    activeAgentCount = 0,
  } = session.activity ?? {};

  if (hasError) {
    return (
      <Pill size="xs" tone="critical">
        Needs attention
      </Pill>
    );
  }

  // Count excludes Prime, so 0 while busy still means Prime is mid-run.
  if (runStatus === "busy") {
    return (
      <Pill size="xs" tone="info">
        {activeAgentCount > 0 ? `${activeAgentCount} working` : "Working"}
      </Pill>
    );
  }

  if (unreadCount === 0) {
    return (
      <Text size="sm" tone="subdued">
        &mdash;
      </Text>
    );
  }

  return (
    <InlineStack gap="1.5" blockAlign="center" wrap="nowrap">
      <Pill size="xs" tone="success">
        Task complete
      </Pill>
      <Text size="xs" tone="subdued">
        {unreadCount} new
      </Text>
    </InlineStack>
  );
}
