import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Surface } from "@/components/ui/patterns/surface";
import { Paragraph, Text } from "@/components/ui/typography";
import type { MemorySuggestionPayload } from "@/shell/contracts";

interface MemorySuggestionCardProps {
  suggestion: MemorySuggestionPayload;
  onConfirm: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
}

/**
 * A confirm/dismiss card for an agent-initiated memory suggestion. Nothing is
 * stored until the user confirms, so global memory is never changed without
 * explicit consent.
 */
export function MemorySuggestionCard({
  suggestion,
  onConfirm,
  onDismiss,
}: MemorySuggestionCardProps) {
  return (
    <Surface tone="magic">
      <BlockStack gap="2">
        <InlineStack gap="1" blockAlign="center">
          <Icon name="Brain" size="xs" tone="accent" />
          <Text size="xs" weight="medium" tone="accent">
            Remember this in {suggestion.scope} memory?
          </Text>
        </InlineStack>
        <Paragraph size="sm" wrap="pre-wrap">
          {suggestion.text}
        </Paragraph>
        <InlineStack gap="2">
          <Button size="xs" onClick={() => onConfirm(suggestion.suggestionId)}>
            Remember
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onDismiss(suggestion.suggestionId)}
          >
            Dismiss
          </Button>
        </InlineStack>
      </BlockStack>
    </Surface>
  );
}
