import { Box } from "@/components/ui/box";
import { BlockStack } from "@/components/ui/layout";
import type { Agent } from "@/shell/features/chat/model/agents";

import { AgentCard } from "./AgentCard";

interface AgentListProps {
  agents: Agent[];
  /** Session the agents belong to; keys each agent's shared live status. */
  sessionId: string;
  /** The active tab's id, so the matching card reads as selected. */
  selectedId: string | null;
  /** Opens (or focuses) an agent's in-app tab. */
  onOpen: (agent: Agent) => void;
  /** Removes a (killed) sub-agent from the list and closes its tab. */
  onRemove?: (agent: Agent) => void;
}

/**
 * Sidebar list of the session's agents — Prime first, then the live sub-agent
 * roster — each rendered as a uniform {@link AgentCard}. Clicking a card opens
 * (or focuses) that agent's thread in its own in-app tab.
 */
export function AgentList({
  agents,
  sessionId,
  selectedId,
  onOpen,
  onRemove,
}: AgentListProps) {
  return (
    <BlockStack align="stretch">
      <Box padding="sm">
        <BlockStack as="ul" gap="1">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              sessionId={sessionId}
              selected={selectedId === agent.id}
              onOpen={() => onOpen(agent)}
              onRemove={
                agent.kind === "subagent" && agent.status === "killed"
                  ? () => onRemove?.(agent)
                  : undefined
              }
            />
          ))}
        </BlockStack>
      </Box>
    </BlockStack>
  );
}
