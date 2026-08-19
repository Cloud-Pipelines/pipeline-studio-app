import { Box } from "@/components/ui/box";
import { BlockStack } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import type { Trigger } from "@/shell/contracts";
import type { Asset } from "@/shell/features/chat/model/assets";
import { useDeleteTrigger } from "@/shell/features/triggers/hooks/useDeleteTrigger";
import { useUpdateTrigger } from "@/shell/features/triggers/hooks/useUpdateTrigger";
import { absoluteApiUrl } from "@/shell/lib/basePath";

import { AssetCard } from "./AssetCard";
import { AssetRowActions } from "./AssetRowActions";

interface AssetListProps {
  sessionId: string;
  assets: Asset[];
  /** The active tab's id, so the matching card reads as selected. */
  selectedId: string | null;
  /** Opens (or focuses) an asset's in-app tab. */
  onOpen: (asset: Asset) => void;
  /** Unpins an artifact by its workspace-relative path. */
  onUnpin: (path: string) => void;
}

/**
 * Unified sidebar list of the session's assets — pages, files, and triggers
 * (apps in future) — each rendered as a uniform {@link AssetCard}. Replaces the
 * former separate sub-agent, trigger, and pinned-artifact panels. Trigger
 * management (enable/disable, copy callback URL, delete) happens inline via
 * hover actions; artifact assets expose an unpin action.
 */
export function AssetList({
  sessionId,
  assets,
  selectedId,
  onOpen,
  onUnpin,
}: AssetListProps) {
  const update = useUpdateTrigger(sessionId);
  const remove = useDeleteTrigger(sessionId);
  const triggerBusy = update.isPending || remove.isPending;

  const copyCallback = (trigger: Trigger): void => {
    if (!trigger.callbackPath) return;
    void navigator.clipboard?.writeText(absoluteApiUrl(trigger.callbackPath));
  };

  return (
    <BlockStack align="stretch">
      {assets.length === 0 ? (
        <Box padding="base">
          <EmptyState
            size="sm"
            title=""
            description="Pages, files, and triggers Prime creates show up here."
          />
        </Box>
      ) : (
        <Box padding="sm">
          <BlockStack as="ul" gap="1">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedId === asset.id}
                onOpen={() => onOpen(asset)}
                actions={
                  <AssetRowActions
                    asset={asset}
                    triggerBusy={triggerBusy}
                    onUnpin={onUnpin}
                    onToggleTrigger={(trigger) =>
                      update.mutate({
                        triggerId: trigger.id,
                        input: { enabled: !trigger.enabled },
                      })
                    }
                    onCopyCallback={copyCallback}
                    onDeleteTrigger={(trigger) => remove.mutate(trigger.id)}
                  />
                }
              />
            ))}
          </BlockStack>
        </Box>
      )}
    </BlockStack>
  );
}
