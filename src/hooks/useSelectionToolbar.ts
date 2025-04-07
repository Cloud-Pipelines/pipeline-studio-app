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
        const initialPosition = {
          x: -1000 + bounds.x + bounds.width,
          y: -1000 + bounds.y,
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
