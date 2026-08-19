import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { ListRow } from "@/components/ui/patterns/list-row";
import { Truncating } from "@/components/ui/patterns/truncating";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import type { Trigger } from "@/shell/contracts";
import { triggerSubtitle } from "@/shell/features/chat/model/assets";

import { AgentStatusLabel } from "../sidebar/agents/AgentStatusIndicator";

interface BusySubagent {
  id: string;
  name: string;
}

interface ActiveTasksIndicatorProps {
  sessionId: string;
  busySubagents: BusySubagent[];
  armedTriggers: Trigger[];
  onOpenAgent: (id: string) => void;
  onAbort: (id: string) => void;
  onOpenTrigger: (id: string) => void;
}

const SPINNER_SIZE = 12;

function pillLabel(count: number): string {
  return count === 1 ? "1 subagent working" : `${count} subagents working`;
}

/**
 * Composer-anchored pill, shown only while sub-agents are running. It sits
 * outside the chat stream so it never implies a blocked turn: Prime stays
 * available while delegated work proceeds.
 */
export function ActiveTasksIndicator({
  sessionId,
  busySubagents,
  armedTriggers,
  onOpenAgent,
  onAbort,
  onOpenTrigger,
}: ActiveTasksIndicatorProps) {
  if (busySubagents.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" tone="default">
          <Spinner size={SPINNER_SIZE} />
          {pillLabel(busySubagents.length)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="overflow-hidden p-1" align="start" side="top">
        <BlockStack gap="2">
          <BlockStack gap="0.5">
            <Box paddingInline="sm">
              <Text size="xs" weight="medium" tone="subdued">
                Working now
              </Text>
            </Box>
            <BlockStack as="ul">
              {busySubagents.map((agent) => (
                <ListRow
                  key={agent.id}
                  as="li"
                  density="cozy"
                  gap="2"
                  hoverable
                  onClick={() => onOpenAgent(agent.id)}
                  prefix={
                    <Box
                      background="success-subtle"
                      blockSize="full"
                      paddingInline="sm"
                    >
                      <InlineStack fill blockAlign="center" align="center">
                        <Icon name="Bot" size="md" tone="subdued" />
                      </InlineStack>
                    </Box>
                  }
                >
                  <BlockStack align="stretch" grow>
                    <InlineStack
                      gap="2"
                      wrap="nowrap"
                      blockAlign="center"
                      align="space-between"
                      grow
                    >
                      <Truncating>
                        <Text
                          size="sm"
                          weight="medium"
                          truncate
                          title={agent.name}
                        >
                          {agent.name}
                        </Text>
                      </Truncating>
                      <IconButton
                        icon="CircleStop"
                        size="xs"
                        tone="critical"
                        aria-label={`Stop ${agent.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onAbort(agent.id);
                        }}
                      />
                    </InlineStack>
                    <AgentStatusLabel
                      sessionId={sessionId}
                      agentId={agent.id}
                    />
                  </BlockStack>
                </ListRow>
              ))}
            </BlockStack>
          </BlockStack>

          {armedTriggers.length > 0 ? (
            <BlockStack gap="0.5">
              <Box paddingInline="sm">
                <Text size="xs" weight="medium" tone="subdued">
                  Monitoring
                </Text>
              </Box>
              <BlockStack as="ul">
                {armedTriggers.map((trigger) => (
                  <ListRow
                    key={trigger.id}
                    as="li"
                    density="cozy"
                    gap="2"
                    hoverable
                    onClick={() => onOpenTrigger(trigger.id)}
                    prefix={
                      <Box blockSize="full" paddingInline="sm">
                        <InlineStack fill blockAlign="center" align="center">
                          <Icon name="Zap" size="md" tone="subdued" />
                        </InlineStack>
                      </Box>
                    }
                  >
                    <BlockStack align="stretch" grow>
                      <Text
                        size="sm"
                        weight="medium"
                        truncate
                        title={trigger.title ?? trigger.name}
                      >
                        {trigger.title ?? trigger.name}
                      </Text>
                      <Text size="xs" tone="subdued" truncate>
                        {triggerSubtitle(trigger)}
                      </Text>
                    </BlockStack>
                  </ListRow>
                ))}
              </BlockStack>
            </BlockStack>
          ) : null}
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
}
