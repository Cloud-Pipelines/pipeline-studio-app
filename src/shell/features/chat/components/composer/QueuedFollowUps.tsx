import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { ListRow } from "@/components/ui/patterns/list-row";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Text } from "@/components/ui/typography";

/** A single queued follow-up, as shown above the composer. */
interface QueuedFollowUp {
  id: string;
  /** The message text; empty when the item is attachments-only. */
  content: string;
}

interface QueuedFollowUpsProps {
  items: QueuedFollowUp[];
  /** Pulls an item out of the queue and steers it into the live run now. */
  onSendNow: (id: string) => void;
  /** Drops an item from the queue without sending it. */
  onDiscard: (id: string) => void;
  /** Disables the per-item controls (e.g. while disconnected/uploading). */
  disabled?: boolean;
}

/**
 * Lists the follow-up messages queued while the agent is mid-run. Each row is
 * deliberately lightweight (xs text, not a chat bubble) and offers "Send now"
 * to jump the line (steer it immediately) or a discard control. The queue
 * auto-drains when the run ends; this is just the waiting area.
 */
export function QueuedFollowUps({
  items,
  onSendNow,
  onDiscard,
  disabled,
}: QueuedFollowUpsProps) {
  if (items.length === 0) return null;

  return (
    <BlockStack gap="1">
      {items.map((item) => (
        <ListRow key={item.id} border="sm" density="compact" gap="2">
          <Truncating>
            <Text size="xs" tone="subdued" truncate>
              {item.content || "Attachment"}
            </Text>
          </Truncating>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onSendNow(item.id)}
            disabled={disabled}
          >
            <Icon name="Send" size="xs" />
            Send now
          </Button>
          <IconButton
            icon="X"
            size="xs"
            variant="ghost"
            onClick={() => onDiscard(item.id)}
            disabled={disabled}
            aria-label="Discard queued message"
          />
        </ListRow>
      ))}
    </BlockStack>
  );
}
