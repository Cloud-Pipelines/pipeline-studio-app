import { useCallback } from "react";

import type { HydratedComponentReference } from "@/utils/componentSpec";

import { useNodesOverlay } from "../../ReactFlow/NodesOverlay/NodesOverlayProvider";

export function useForceUpdateTasks(
  currentComponent: HydratedComponentReference | null,
) {
  const { notifyNode, getNodeIdsByDigest, fitNodeIntoView } = useNodesOverlay();

  return useCallback(
    async (digest: string) => {
      if (!currentComponent) {
        return;
      }

      const nodeIds = getNodeIdsByDigest(digest);

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
          replaceWith: currentComponent,
          ids: nodeIds,
        },
      });
    },
    [getNodeIdsByDigest, fitNodeIntoView, notifyNode, currentComponent],
  );
}
