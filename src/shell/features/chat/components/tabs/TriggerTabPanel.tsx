import { Box } from "@/components/ui/box";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import type { Trigger } from "@/shell/contracts";

import { TriggerTabView } from "./TriggerTabView";

interface TriggerTabPanelProps {
  sessionId: string;
  triggerId: string;
  triggers: Trigger[];
  onClose: () => void;
}

/**
 * Resolves a trigger tab's id against the live roster. A trigger removed
 * elsewhere (e.g. the sidebar) leaves a stale tab; surface a clear placeholder
 * rather than a blank panel until the user closes it.
 */
export function TriggerTabPanel({
  sessionId,
  triggerId,
  triggers,
  onClose,
}: TriggerTabPanelProps) {
  const trigger = triggers.find((t) => t.id === triggerId);
  if (!trigger) {
    return (
      <Box padding="base">
        <EmptyState
          icon="Zap"
          title="Trigger no longer exists"
          description="This trigger was deleted. Close this tab to dismiss it."
        />
      </Box>
    );
  }
  return (
    <TriggerTabView sessionId={sessionId} trigger={trigger} onClose={onClose} />
  );
}
