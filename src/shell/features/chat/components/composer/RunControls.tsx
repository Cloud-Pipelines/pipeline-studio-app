import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";

interface RunControlsProps {
  /** Whether the composed message can be sent/steered. */
  canSubmit: boolean;
  /** Aborts the agent's in-progress run. */
  onAbort?: () => void;
  /** Steers the composed message into the live run immediately. */
  onSteer: () => void;
  /** Queues the composed message as a follow-up. */
  onFollowUp: () => void;
}

/**
 * Mid-run controls shown above the input while the agent is busy: Stop the run,
 * Steer the composed message in now, or queue it as a Follow up.
 */
export function RunControls({
  canSubmit,
  onAbort,
  onSteer,
  onFollowUp,
}: RunControlsProps) {
  return (
    <InlineStack gap="2" blockAlign="center" wrap="wrap">
      <Button variant="outline" size="sm" onClick={onAbort} disabled={!onAbort}>
        <Icon name="Square" size="xs" />
        Stop
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onSteer}
        disabled={!canSubmit}
      >
        <Icon name="Send" size="xs" />
        Steer
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onFollowUp}
        disabled={!canSubmit}
      >
        <Icon name="Clock" size="xs" />
        Follow up
      </Button>
    </InlineStack>
  );
}
