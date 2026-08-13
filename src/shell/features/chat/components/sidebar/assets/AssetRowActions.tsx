import { InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import type { Trigger } from "@/shell/contracts";
import type { Asset } from "@/shell/features/chat/model/assets";

interface AssetRowActionsProps {
  asset: Asset;
  /** Whether a trigger mutation is in flight (disables trigger actions). */
  triggerBusy: boolean;
  /** Unpins an artifact by its workspace-relative path. */
  onUnpin: (path: string) => void;
  /** Toggles a trigger's enabled state. */
  onToggleTrigger: (trigger: Trigger) => void;
  /** Copies a callback trigger's URL to the clipboard. */
  onCopyCallback: (trigger: Trigger) => void;
  /** Deletes a trigger. */
  onDeleteTrigger: (trigger: Trigger) => void;
}

/** Stops a row action from also triggering the card's open-on-click. */
function withStop(handler: () => void) {
  return (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    handler();
  };
}

/**
 * Hover-revealed actions for an asset card: unpin for artifacts, or
 * enable/disable, copy callback URL, and delete for triggers.
 */
export function AssetRowActions({
  asset,
  triggerBusy,
  onUnpin,
  onToggleTrigger,
  onCopyCallback,
  onDeleteTrigger,
}: AssetRowActionsProps) {
  if (asset.kind !== "trigger") {
    return (
      <IconButton
        icon="PinOff"
        size="xs"
        tone="critical"
        aria-label="Unpin artifact"
        onClick={withStop(() => onUnpin(asset.path))}
      />
    );
  }

  const { trigger } = asset;
  return (
    <InlineStack gap="1" wrap="nowrap" blockAlign="center">
      <IconButton
        icon="Power"
        size="xs"
        tone={trigger.enabled ? "success" : "default"}
        disabled={triggerBusy}
        aria-label={trigger.enabled ? "Disable trigger" : "Enable trigger"}
        onClick={withStop(() => onToggleTrigger(trigger))}
      />
      {trigger.kind === "callback" && trigger.callbackPath ? (
        <IconButton
          icon="Copy"
          size="xs"
          aria-label="Copy callback URL"
          onClick={withStop(() => onCopyCallback(trigger))}
        />
      ) : null}
      <IconButton
        icon="Trash2"
        size="xs"
        tone="critical"
        disabled={triggerBusy}
        aria-label="Delete trigger"
        onClick={withStop(() => onDeleteTrigger(trigger))}
      />
    </InlineStack>
  );
}
