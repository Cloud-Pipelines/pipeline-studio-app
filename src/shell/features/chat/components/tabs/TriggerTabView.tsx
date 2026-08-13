import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { CopyText } from "@/components/ui/patterns/copy-text";
import { Pill } from "@/components/ui/patterns/pill";
import { ScrollRegion } from "@/components/ui/patterns/scroll-region";
import { Section } from "@/components/ui/patterns/section";
import { Toolbar } from "@/components/ui/patterns/toolbar";
import { Heading, Paragraph, Text } from "@/components/ui/typography";
import type { Trigger } from "@/shell/contracts";
import { useDeleteTrigger } from "@/shell/features/triggers/hooks/useDeleteTrigger";
import { useUpdateTrigger } from "@/shell/features/triggers/hooks/useUpdateTrigger";
import { absoluteApiUrl } from "@/shell/lib/basePath";
import { truncateMiddle } from "@/shell/lib/utils";

import { DetailRow } from "./DetailRow";

interface TriggerTabViewProps {
  sessionId: string;
  /** The trigger this tab is dedicated to. */
  trigger: Trigger;
  /** Closes this tab (called after the trigger is deleted). */
  onClose: () => void;
}

const KIND_ICON: Record<Trigger["kind"], IconName> = {
  schedule: "Clock",
  callback: "Webhook",
};

/** Human-readable summary of a trigger's signal source. */
function scheduleDetail(trigger: Trigger): string {
  if (trigger.schedule?.every) return `Every ${trigger.schedule.every}`;
  if (trigger.schedule?.cron) return `Cron: ${trigger.schedule.cron}`;
  return "Schedule";
}

/** Human-readable summary of where a trigger delivers its firings. */
function targetDetail(target: Trigger["target"]): string {
  if (target.type === "subagent") {
    return `Sub-agent: ${target.agentName ?? target.spec.name ?? "dedicated"}`;
  }
  return "Prime";
}

/**
 * Detail view for a single trigger, shown in its own in-app tab. Surfaces the
 * trigger's configuration (kind, schedule or callback URL, prompt template,
 * source) and the management actions previously inline in the sidebar list:
 * enable/disable, copy the callback URL, and delete (which closes the tab).
 */
export function TriggerTabView({
  sessionId,
  trigger,
  onClose,
}: TriggerTabViewProps) {
  const update = useUpdateTrigger(sessionId);
  const remove = useDeleteTrigger(sessionId);
  const busy = update.isPending || remove.isPending;

  const callbackUrl =
    trigger.kind === "callback" && trigger.callbackPath
      ? absoluteApiUrl(trigger.callbackPath)
      : null;

  function toggle() {
    update.mutate({
      triggerId: trigger.id,
      input: { enabled: !trigger.enabled },
    });
  }

  function handleDelete() {
    remove.mutate(trigger.id, { onSuccess: onClose });
  }

  return (
    <BlockStack grow>
      <Toolbar chrome="light" align="end" aria-label="Trigger actions">
        <Button
          variant="toolbar"
          size="xs"
          tone={trigger.enabled ? "success" : "default"}
          disabled={busy}
          onClick={toggle}
        >
          <Icon name="Power" size="xs" />
          {trigger.enabled ? "Disable" : "Enable"}
        </Button>
        <Button
          variant="toolbar"
          size="xs"
          tone="critical"
          disabled={busy}
          onClick={handleDelete}
        >
          <Icon name="Trash2" size="xs" />
          Delete
        </Button>
      </Toolbar>
      <ScrollRegion axis="y">
        <Box padding="base">
          <BlockStack gap="4" grow>
            <InlineStack gap="2" blockAlign="center" wrap="nowrap">
              <Icon
                name={KIND_ICON[trigger.kind]}
                size="lg"
                tone={trigger.enabled ? "strong" : "subdued"}
              />
              <BlockStack gap="0">
                <Heading level={2}>{trigger.title ?? trigger.name}</Heading>
                <Text size="xs" tone="subdued">
                  {trigger.name}
                </Text>
              </BlockStack>
              <Pill size="sm" tone={trigger.enabled ? "success" : "subdued"}>
                {trigger.enabled ? "Enabled" : "Disabled"}
              </Pill>
            </InlineStack>

            <Section title="Configuration">
              <BlockStack as="dl" gap="2">
                <DetailRow label="Kind">{trigger.kind}</DetailRow>
                <DetailRow label="Source">{trigger.source}</DetailRow>
                <DetailRow label="Target">
                  {targetDetail(trigger.target)}
                </DetailRow>
                {trigger.kind === "schedule" ? (
                  <DetailRow label="Schedule">
                    {scheduleDetail(trigger)}
                  </DetailRow>
                ) : null}
                {callbackUrl ? (
                  <DetailRow label="Callback URL">
                    <CopyText
                      value={callbackUrl}
                      displayValue={truncateMiddle(callbackUrl, 48)}
                      size="sm"
                      font="mono"
                      truncate
                    />
                  </DetailRow>
                ) : null}
                <DetailRow label="Handler">
                  {trigger.hasHandler ? "Compiled handler" : "Prompt template"}
                </DetailRow>
              </BlockStack>
            </Section>

            {trigger.prompt ? (
              <Section title="Prompt">
                <Paragraph size="sm" tone="subdued">
                  {trigger.prompt}
                </Paragraph>
              </Section>
            ) : null}
          </BlockStack>
        </Box>
      </ScrollRegion>
    </BlockStack>
  );
}
