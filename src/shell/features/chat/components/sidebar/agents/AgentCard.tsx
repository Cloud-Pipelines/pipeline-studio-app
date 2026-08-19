import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { HoverReveal } from "@/components/ui/patterns/hover-reveal";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { ListRow } from "@/components/ui/patterns/list-row";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Text } from "@/components/ui/typography";
import type { Agent } from "@/shell/features/chat/model/agents";

import { AgentStatusIndicator, AgentStatusLabel } from "./AgentStatusIndicator";

interface AgentCardProps {
  agent: Agent;
  /** Session the agent belongs to; keys its shared live status. */
  sessionId: string;
  /** Whether this agent's tab is the active one. */
  selected: boolean;
  /** Opens (or focuses) the agent's in-app tab. */
  onOpen: () => void;
  /**
   * Removes the agent from the list (e.g. dismissing a killed sub-agent).
   * When provided, a hover-revealed remove action is shown.
   */
  onRemove?: () => void;
}

/**
 * A condensed card representing one session agent (Prime or a sub-agent),
 * styled like {@link AssetCard}. The leading icon conveys the agent kind; the
 * trailing indicator reflects its live status. Clicking the card opens (or
 * focuses) the agent's thread tab.
 */
export function AgentCard({
  agent,
  sessionId,
  selected,
  onOpen,
  onRemove,
}: AgentCardProps) {
  return (
    <ListRow
      as="li"
      density="cozy"
      gap="2"
      hoverable
      selected={selected}
      onClick={onOpen}
      prefix={
        <Box background="success-subtle" blockSize="full" paddingInline="sm">
          <InlineStack fill blockAlign="center" align="center">
            <Icon
              name={agent.kind === "prime" ? "Crown" : "Bot"}
              size="lg"
              tone="subdued"
            />
          </InlineStack>
        </Box>
      }
    >
      <BlockStack gap="0" align="stretch" grow>
        <InlineStack
          gap="2"
          wrap="nowrap"
          blockAlign="center"
          align="space-between"
          grow
        >
          <Truncating>
            <Text size="sm" weight="medium" truncate title={agent.name}>
              {agent.name}
            </Text>
          </Truncating>
          <AgentStatusIndicator sessionId={sessionId} agentId={agent.id} />
          {onRemove ? (
            <HoverReveal>
              <IconButton
                icon="Trash2"
                size="xs"
                tone="critical"
                aria-label={`Remove ${agent.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
              />
            </HoverReveal>
          ) : null}
        </InlineStack>
        <AgentStatusLabel sessionId={sessionId} agentId={agent.id} />
      </BlockStack>
    </ListRow>
  );
}
