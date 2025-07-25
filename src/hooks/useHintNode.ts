import type { Node } from "@xyflow/react";
import { useConnection } from "@xyflow/react";
import { useMemo } from "react";

import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { HintNodeData } from "@/types/hintNode";

const HINT_NODE_ID = "hint-node";

export const useHintNode = ({ key, hint }: { key: string; hint: string }) => {
  const connectionTo = useConnection((connection) => connection.to);
  const connectionToHandle = useConnection((connection) => connection.toHandle);
  const connectionFromHandle = useConnection(
    (connection) => connection.fromHandle,
  );
  const connectionInProgress = useConnection(
    (connection) => connection.inProgress,
  );

  const { searchResult } = useComponentLibrary();

  const hasResults = useMemo(
    () =>
      searchResult &&
      (searchResult.components.standard.length > 0 ||
        searchResult.components.user.length > 0),
    [searchResult],
  );

  const isOverValidTarget = useMemo(
    () => connectionInProgress && connectionToHandle !== null,
    [connectionInProgress, connectionToHandle],
  );

  const shouldShowHint = useMemo(
    () => connectionInProgress && hasResults && !isOverValidTarget,
    [connectionInProgress, hasResults, isOverValidTarget],
  );

  const hintNode = useMemo((): Node<HintNodeData> | null => {
    if (!shouldShowHint || !connectionTo) {
      return null;
    }

    const side = connectionFromHandle?.id?.includes("input") ? "left" : "right";

    return {
      id: HINT_NODE_ID + "-" + key,
      type: "hint",
      position: connectionTo,
      data: {
        key,
        hint,
        side,
      },
      draggable: false,
      selectable: false,
      deletable: false,
      connectable: false,
      focusable: false,
      zIndex: 1000,
    };
  }, [shouldShowHint, connectionTo, connectionFromHandle?.id, key, hint]);

  return hintNode;
};
