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

  const addToolbarNode = useCallback(
    (position: { x: number; y: number }) => {
      if (!reactFlowInstance) return;

      const toolbarNode = {
        id: SELECTION_TOOLBAR_ID,
        type: "toolbar",
        position,
        zIndex: 1200,
        data: {
          onDelete: handleDelete,
          onDuplicate: handleDuplicate,
        } as SelectionToolbarProps,
      };

      reactFlowInstance.addNodes(toolbarNode);
    },
    [reactFlowInstance, handleDelete, handleDuplicate]
  );

  const calculateToolbarPosition = useCallback(
    (nodes: Node[]) => {
      if (!reactFlowInstance) return null;

      const bounds = getNodesBounds(nodes);
      if (!bounds) return null;

      const toolbarNode = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);
      console.log("Toolbar node:", toolbarNode);
      if (!toolbarNode) return null;

      return {
        x: bounds.x + bounds.width - (toolbarNode.measured?.width ?? 0),
        y: bounds.y - (toolbarNode.measured?.height ?? 0),
      };
    },
    [reactFlowInstance, getNodesBounds]
  );

  const updateToolbarNodePosition = useCallback(
    (position: { x: number; y: number }) => {
      if (!reactFlowInstance) return;

      const toolbarNode = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);
      if (toolbarNode) {
        reactFlowInstance.updateNode(SELECTION_TOOLBAR_ID, {
          ...toolbarNode,
          position,
        });
      }
    },
    [reactFlowInstance]
  );

  const updateToolbarPosition = useCallback(
    (nodes: Node[]) => {
      const position = calculateToolbarPosition(nodes);
      console.log("Toolbar position:", position);
      if (position) updateToolbarNodePosition(position);
    },
    [calculateToolbarPosition, updateToolbarNodePosition]
  );

  const removeToolbarNode = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setNodes((nodes: Node[]) =>
        nodes.filter((node) => node.id !== SELECTION_TOOLBAR_ID)
      );
    }
  }, [reactFlowInstance]);

  const initializeToolbarNode = useCallback(() => {
    if (!reactFlowInstance) return;

    const bounds = getNodesBounds(selectedNodes);
    if (!bounds) return;

    const toolbarPreRenderCoordinates = {
      x: -1000 - Math.abs(bounds.x) - Math.abs(bounds.width),
      y: -1000 - Math.abs(bounds.y) - Math.abs(bounds.height),
    };

    const existingToolbarNode = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);
    if (!existingToolbarNode) {
      addToolbarNode(toolbarPreRenderCoordinates);
    } else {
      updateToolbarNodePosition(toolbarPreRenderCoordinates);
    }
  }, [
    reactFlowInstance,
    selectedNodes,
    getNodesBounds,
    addToolbarNode,
    updateToolbarNodePosition,
  ]);

  useEffect(() => {
    if (reactFlowInstance) {
      if (isToolbarVisible) {
        initializeToolbarNode();
        console.log("Toolbar initialized");
        setTimeout(() => updateToolbarPosition(selectedNodes), 0);
      } else {
        removeToolbarNode();
      }
    }
  }, [
    isToolbarVisible,
    reactFlowInstance,
    selectedNodes,
    initializeToolbarNode,
    updateToolbarPosition,
    removeToolbarNode,
  ]);

  return {
    showToolbar,
    hideToolbar,
    isToolbarVisible,
    updateToolbarPosition,
  };
}
