import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";

interface KilledAgentNoticeProps {
  /**
   * Removes the (killed) agent from the roster and closes its tab. Wired to the
   * "Remove from list" action.
   */
  onRemove?: () => void;
}

/**
 * Replaces the composer for a killed agent: a terminal notice plus a Revive
 * placeholder (no handler yet) and a Remove action. A killed agent can't take
 * input, so the input controls are swapped out for this.
 */
export function KilledAgentNotice({ onRemove }: KilledAgentNoticeProps) {
  return (
    <Box borderBlockStart="sm" padding="sm" inlineSize="full">
      <BlockStack gap="2">
        <InlineStack gap="2" blockAlign="center" wrap="wrap">
          <Button variant="outline" size="sm">
            <Icon name="RotateCcw" size="xs" />
            Revive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={!onRemove}
          >
            <Icon name="Trash" size="xs" />
            Remove from list
          </Button>
        </InlineStack>
        <InlineStack
          gap="2"
          blockAlign="center"
          align="space-between"
          wrap="wrap"
        >
          <InlineStack gap="2" blockAlign="center">
            <Icon name="Ban" size="xs" tone="subdued" />
            <Text tone="subdued">Agent killed</Text>
          </InlineStack>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}
