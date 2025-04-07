import { type Node, type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import type { SelectionToolbarProps } from "@/DragNDrop/SelectionToolbar";

const SELECTION_TOOLBAR_ID = "selection-toolbar";

export function useSelectionToolbar({
  reactFlowInstance,
  selectedNodes,
  onDeleteNodes,
  onDuplicateNodes,
}: {
  reactFlowInstance?: ReactFlowInstance;
  selectedNodes: Node[];
  onDeleteNodes: (nodes: Node[]) => void;
  onDuplicateNodes: (nodes: Node[]) => void;
}) {
  const { getNodesBounds } = useReactFlow();

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [toolbarNode, setToolbarNode] = useState<{
    id: string;
    type: string;
    position: { x: number; y: number };
    zIndex: number;
    data: SelectionToolbarProps;
  } | null>(null);

  const showToolbar = useCallback(() => setIsToolbarVisible(true), []);
  const hideToolbar = useCallback(() => setIsToolbarVisible(false), []);

  const handleDelete = useCallback(() => {
    onDeleteNodes(selectedNodes);
    hideToolbar();
  }, [selectedNodes, onDeleteNodes, hideToolbar]);

  const handleDuplicate = useCallback(() => {
    onDuplicateNodes(selectedNodes);
    hideToolbar();
  }, [selectedNodes, onDuplicateNodes, hideToolbar]);

  const updateToolbarPosition = useCallback(
    (nodes: Node[]) => {
      if (!reactFlowInstance) return null;

      const toolbar = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);
      if (!toolbar?.measured) return null;

      const size = toolbar.measured;

      const bounds = getNodesBounds(nodes);
      if (!bounds) return null;

      const minCoordinates = getMinCoordinates(nodes);

      bounds.x = minCoordinates.x;
      bounds.y = minCoordinates.y;

      const position = {
        x: bounds.x + bounds.width - (size.width ?? 0),
        y: bounds.y - (size.height ?? 0),
      };

      setToolbarNode((prev) => ({
        ...prev!,
        position,
      }));
    },
    [reactFlowInstance, getNodesBounds]
  );

  useEffect(() => {
    if (reactFlowInstance && toolbarNode) {
      reactFlowInstance.setNodes((nodes: Node[]) => {
        const filteredNodes = nodes.filter(
          (node) => node.id !== SELECTION_TOOLBAR_ID
        );
        return isToolbarVisible
          ? [...filteredNodes, toolbarNode]
          : filteredNodes;
      });
    }
  }, [reactFlowInstance, toolbarNode, isToolbarVisible]);

  useEffect(() => {
    if (isToolbarVisible) {
      const bounds = getNodesBounds(selectedNodes);
      if (bounds) {
        // Render the toolbar offscreen so we can measure its dimensions before moving it to the correct position
        const initialPosition = {
          x: -1000 + Math.abs(bounds.x + bounds.width),
          y: -1000 + Math.abs(bounds.y),
        };

        setToolbarNode({
          id: SELECTION_TOOLBAR_ID,
          type: "toolbar",
          position: initialPosition,
          zIndex: 1200,
          data: {
            onDelete: handleDelete,
            onDuplicate: handleDuplicate,
          },
        });

        // A timeout is needed to avoid a race condition between rendering the toolbar to measure it and rendering it in its final position
        setTimeout(() => updateToolbarPosition(selectedNodes), 0);
      }
    }
  }, [
    isToolbarVisible,
    selectedNodes,
    getNodesBounds,
    handleDelete,
    handleDuplicate,
    updateToolbarPosition,
  ]);

  return {
    showToolbar,
    hideToolbar,
    isToolbarVisible,
    updateToolbarPosition,
  };
}

/*
 * 'getNodesBounds' from useReactFlow currently appears to be bugged and is producing the coordinates of the previous node position, not the current node position.
 * As a workaround this method calculates the selection origin manually (min x and min y position of all selected nodes).
 */
const getMinCoordinates = (nodes: Node[]) => {
  return nodes.reduce(
    (min, node) => ({
      x: Math.min(min.x, node.position.x),
      y: Math.min(min.y, node.position.y),
    }),
    { x: Infinity, y: Infinity }
  );
};
