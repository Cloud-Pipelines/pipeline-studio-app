import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/typography";
import { useAgentStatus } from "@/shell/features/chat/hooks/useAgentStatus";

import { StatusDot } from "../StatusDot";

interface AgentStatusProps {
  /** Session the agent belongs to; with `agentId` keys the shared live status. */
  sessionId: string;
  /** The agent's id (`"prime"` or a sub-agent id). */
  agentId: string;
}

/**
 * Status-tinted indicator mirroring an agent's lifecycle. A busy run pulses; an
 * idle agent shows its terminal/active state. Reads the agent's live status from
 * the shared cache, so the sidebar agent card and the opened agent tab trigger
 * always agree and the state survives a page reload.
 */
export function AgentStatusIndicator({ sessionId, agentId }: AgentStatusProps) {
  const { status, busy } = useAgentStatus(sessionId, agentId);

  if (busy) {
    return <StatusDot variant="busy" />;
  }

  switch (status) {
    case "active":
      return <StatusDot variant="active" />;
    case "completed":
      return <Icon name="Check" size="xs" tone="subdued" />;
    case "killed":
      return <Icon name="Ban" size="xs" tone="subdued" />;
    case "error":
      return <Icon name="TriangleAlert" size="xs" tone="critical" />;
  }
}

/**
 * The agent's current activity (or lifecycle) as a short, truncating line of
 * subdued text — the human-readable companion to {@link AgentStatusIndicator}.
 */
export function AgentStatusLabel({ sessionId, agentId }: AgentStatusProps) {
  const { label } = useAgentStatus(sessionId, agentId);
  return (
    <Text size="xs" tone="subdued" truncate>
      {label}
    </Text>
  );
}
