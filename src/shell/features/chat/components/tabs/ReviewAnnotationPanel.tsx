import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";

interface ReviewAnnotationPanelProps {
  /** The user's note for the selected region. */
  note: string;
  /** True while the cropped image is being uploaded/sent. */
  submitting: boolean;
  onNoteChange: (note: string) => void;
  /** Discards the current selection and returns to selecting. */
  onReselect: () => void;
  /** Dismisses the review without sending. */
  onCancel: () => void;
  /** Sends the cropped region and note to Prime. */
  onSend: () => void;
}

/**
 * The annotation step of the review overlay: a note field plus Reselect, Cancel,
 * and Send actions, anchored to the bottom of the frozen artifact.
 */
export function ReviewAnnotationPanel({
  note,
  submitting,
  onNoteChange,
  onReselect,
  onCancel,
  onSend,
}: ReviewAnnotationPanelProps) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 p-3"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Box
        background="base"
        border="sm"
        borderColor="base"
        borderRadius="base"
        padding="base"
        shadow="lg"
        maxInlineSize="2xl"
      >
        <BlockStack gap="2">
          <Text size="sm" weight="medium">
            Add a note for this region
          </Text>
          <Textarea
            autoFocus
            rows={3}
            placeholder="Describe what you'd like Prime to look at..."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={submitting}
            aria-label="Review note"
          />
          <InlineStack gap="2" align="space-between" wrap="nowrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReselect}
              disabled={submitting}
            >
              Reselect
            </Button>
            <InlineStack gap="2" wrap="nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={onSend} disabled={submitting}>
                {submitting ? "Sending..." : "Send to Prime"}
              </Button>
            </InlineStack>
          </InlineStack>
        </BlockStack>
      </Box>
    </div>
  );
}
