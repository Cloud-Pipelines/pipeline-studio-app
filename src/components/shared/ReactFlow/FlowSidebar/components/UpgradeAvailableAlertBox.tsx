import { useCallback, useState } from "react";

import { InfoBox } from "@/components/shared/InfoBox";
import { useOutdatedComponents } from "@/components/shared/ManageComponent/hooks/useOutdatedComponents";
import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Paragraph } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { getStorage } from "@/utils/typedStorage";

import { useNodesOverlay } from "../../NodesOverlay/NodesOverlayProvider";

const UpgradeAvailableAlertBoxSkeleton = () => {
  return (
    <BlockStack className="px-2">
      <Skeleton size="lg" className="h-4 w-full" />
    </BlockStack>
  );
};

/**
 * Component to display an alert box when there are outdated components in the graph
 *
 * @returns The UpgradeAvailableAlertBox component
 */
export const UpgradeAvailableAlertBox = withSuspenseWrapper(() => {
  const remoteComponentLibrarySearchEnabled = useBetaFlagValue(
    "remote-component-library-search",
  );

  const notify = useToastNotification();
  const [dismissed, setDismissed] = useDissmissedStorage();

  const { usedComponentsFolder } = useComponentLibrary();

  const { data: outdatedComponents } = useOutdatedComponents(
    usedComponentsFolder.components ?? [],
  );

  const dismissCallback = useCallback(() => {
    setDismissed();
    notify("Upgrade alert dismissed for next 24 hours", "success");
  }, [setDismissed, notify]);

  const upgradeAllComponentsCallback =
    useUpgradeAllComponentsCallback(outdatedComponents);

  const showOutdatedComponentsAlert =
    remoteComponentLibrarySearchEnabled &&
    outdatedComponents.length > 0 &&
    !dismissed;

  return showOutdatedComponentsAlert ? (
    <BlockStack className="px-2">
      <InfoBox title="Upgrades available" key="outdated-components">
        <BlockStack gap="2">
          <Paragraph size="xs">
            You have {outdatedComponents.length} outdated components used in
            your Pipeline.
          </Paragraph>
          <InlineStack align="space-between" className="w-full">
            <Button size="xs" variant="secondary" onClick={dismissCallback}>
              Dismiss
            </Button>
            <Button size="xs" onClick={upgradeAllComponentsCallback}>
              Review
            </Button>
          </InlineStack>
        </BlockStack>
      </InfoBox>
    </BlockStack>
  ) : null;
}, UpgradeAvailableAlertBoxSkeleton);

interface DismissedStorage {
  upgradeAvailableAlertDismissed: Date | undefined;
}

const storage = getStorage<keyof DismissedStorage, DismissedStorage>({
  encode: (value: Date | undefined) => value?.toISOString() ?? "",
  decode: (value) => new Date(value),
});

function useDissmissedStorage() {
  const [dismissed, setDismissed] = useState(
    storage.getItem("upgradeAvailableAlertDismissed"),
  );
  const setDismissedValue = useCallback(() => {
    /**
     * Default behavior is to dismiss the alert for 1 day
     */
    const value = new Date(Date.now() + 1000 * 60 * 60 * 24);
    storage.setItem("upgradeAvailableAlertDismissed", value);
    setDismissed(value);
  }, []);

  return [dismissed && dismissed > new Date(), setDismissedValue] as const;
}

function useUpgradeAllComponentsCallback(
  outdatedComponents: ReturnType<typeof useOutdatedComponents>["data"],
) {
  const { notifyNode, getNodeIdsByDigest, fitNodeIntoView } = useNodesOverlay();

  return useCallback(async () => {
    if (outdatedComponents.length === 0) {
      return;
    }

    const nodeIds = outdatedComponents.flatMap(([outdated, _]) =>
      getNodeIdsByDigest(outdated.digest),
    );

    if (nodeIds.length === 0) {
      return;
    }

    const nodeId = nodeIds.pop();

    if (!nodeId) {
      return;
    }

    await fitNodeIntoView(nodeId);

    notifyNode(nodeId, {
      type: "update-overlay",
      data: {
        replaceWith: new Map(
          outdatedComponents.map(([outdated, mrc]) => [outdated.digest, mrc]),
        ),
        ids: nodeIds,
      },
    });
  }, [getNodeIdsByDigest, fitNodeIntoView, notifyNode, outdatedComponents]);
}
