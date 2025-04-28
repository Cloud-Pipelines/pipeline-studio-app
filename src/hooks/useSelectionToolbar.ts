import { type Node, type ReactFlowInstance } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import type { SelectionToolbarProps } from "@/types/selectionToolbar";
import { SELECTION_TOOLBAR_ID } from "@/utils/constants";

const TOOLBAR_NODE_BASE = {
  id: SELECTION_TOOLBAR_ID,
  type: "toolbar",
  position: { x: 0, y: 0 },
  zIndex: 1200,
  selectable: false,
  data: {
    hidden: true,
  },
};

export function useSelectionToolbar({
  reactFlowInstance,
  onDeleteNodes,
  onDuplicateNodes,
}: {
  reactFlowInstance?: ReactFlowInstance;
  onDeleteNodes: () => void;
  onDuplicateNodes: () => Node[];
}) {
  const [toolbarSize, setToolbarSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const [toolbar, setToolbar] = useState<Node>(TOOLBAR_NODE_BASE);

  const measureToolbarSize = useCallback(() => {
    if (!reactFlowInstance) return;

    const mountedNode = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);

    if (!mountedNode?.measured) {
      console.error("Toolbar measurements are missing.");
      return;
    }

    const size = {
      width: 0,
      height: 0,
    };

    if (mountedNode?.measured) {
      size.width = mountedNode.measured.width ?? 0;
      size.height = mountedNode.measured.height ?? 0;

      setToolbarSize(size);
    }
  }, [reactFlowInstance]);

  const updateToolbarPosition = useCallback(
    (nodes: Node[]) => {
      const bounds = getNodesBounds(nodes);

      const position = {
        x: bounds.x + bounds.width - toolbarSize.width,
        y: bounds.y - toolbarSize.height,
      };

      setToolbar((prev) => ({
        ...prev,
        position,
      }));
    },
    [toolbarSize],
  );

  const showToolbar = useCallback(
    (nodes?: Node[]) => {
      setToolbar((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          hidden: false,
        },
      }));
      if (nodes) {
        updateToolbarPosition(nodes);
      }
    },
    [updateToolbarPosition],
  );

  const hideToolbar = useCallback(() => {
    setToolbar((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        hidden: true,
      },
    }));
  }, []);

  const handleDuplicateNodes = useCallback(() => {
    const newNodes = onDuplicateNodes();
    updateToolbarPosition(newNodes);
  }, [onDuplicateNodes, updateToolbarPosition]);

  useEffect(() => {
    measureToolbarSize();
  }, [measureToolbarSize]);

  useEffect(() => {
    setToolbar((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        onDelete: onDeleteNodes,
        onDuplicate: handleDuplicateNodes,
      } as SelectionToolbarProps,
    }));
  }, [onDeleteNodes, handleDuplicateNodes]);

  return {
    toolbar,
    showToolbar,
    hideToolbar,
    updateToolbarPosition,
  };
}

/*
 * 'getNodesBounds' from useReactFlow currently appears to be bugged and is producing the incorrect coordinates based on the old node position.
 * As a workaround this method calculates the node bounds origin and size manually.
 */
const getNodesBounds = (nodes: Node[]) => {
  const bounds = nodes.reduce(
    (acc, node) => {
      if (!node.measured) {
        console.error("Node is missing measurement data:", node.id);
        return acc;
      }

      const width = node.measured?.width || 0;
      const height = node.measured?.height || 0;

      return {
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + width),
        maxY: Math.max(acc.maxY, node.position.y + height),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  return {
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    x: bounds.minX,
    y: bounds.minY,
  };
};
