import { type Node, type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import type { SelectionToolbarProps } from "@/DragNDrop/SelectionToolbar";

const SELECTION_TOOLBAR_ID = "selection-toolbar";

const FALSE_POSITION = {
  x: -1000,
  y: -1000,
};

const TOOLBAR_NODE_BASE = {
  id: SELECTION_TOOLBAR_ID,
  type: "toolbar",
  position: FALSE_POSITION,
  zIndex: 1200,
  data: {},
};

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
  const [toolbarSize, setToolbarSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const addToolbarNode = useCallback(
    (position: { x: number; y: number }) => {
      if (!reactFlowInstance) {
        console.log("No reactFlowInstance found");
        return;
      }

      const toolbar = getToolbarData();

      console.log("Adding toolbar node at position:", position);

      const newNode = {
        ...toolbar,
        position,
      };

      reactFlowInstance.addNodes([newNode]);
    },
    [reactFlowInstance]
  );

  const updateToolbarNode = useCallback(
    (position: { x: number; y: number }) => {
      if (!reactFlowInstance) {
        console.log("No reactFlowInstance found");
        return;
      }

      const toolbar = getToolbarData();

      const updatedNode = {
        ...toolbar,
        position,
      };

      reactFlowInstance.updateNode(SELECTION_TOOLBAR_ID, updatedNode);
    },
    [reactFlowInstance]
  );

  const removeToolbarNode = useCallback(() => {
    if (!reactFlowInstance) {
      console.log("No reactFlowInstance found");
      return;
    }

    console.log("Removing toolbar node");
    reactFlowInstance.deleteElements({
      nodes: [{ id: SELECTION_TOOLBAR_ID }],
    });
  }, [reactFlowInstance]);

  const addOrUpdateToolbarNode = useCallback(
    (position: { x: number; y: number }) => {
      // to be removed
      if (position.x === -1000 && position.y === -1000) {
        console.log("Toolbar position is offscreen");
        return;
      }

      const existingNode = reactFlowInstance?.getNode(SELECTION_TOOLBAR_ID);

      if (existingNode) {
        console.log("Toolbar node exists, updating it");
        updateToolbarNode(position);
      } else {
        console.log("Toolbar node does not exist, adding it");
        addToolbarNode(position);
      }
    },
    [reactFlowInstance, updateToolbarNode, addToolbarNode]
  );

  const updateToolbarPosition = useCallback(
    (nodes: Node[]) => {
      const bounds = getNodesBounds(nodes);
      if (!bounds) return null;

      const minCoordinates = getMinCoordinates(nodes);

      bounds.x = minCoordinates.x;
      bounds.y = minCoordinates.y;

      const position = {
        x: bounds.x + bounds.width - (toolbarSize.width ?? 0),
        y: bounds.y - (toolbarSize.height ?? 0),
      };

      console.log("updateToolbarPosition", position);

      addOrUpdateToolbarNode(position);
    },
    [toolbarSize, getNodesBounds, addOrUpdateToolbarNode]
  );

  const showToolbar = useCallback(() => {
    console.log("unhidden");
    setIsToolbarVisible(true);
    updateToolbarPosition(selectedNodes);
  }, [selectedNodes, updateToolbarPosition]);

  const hideToolbar = useCallback(() => {
    console.log("hiding");
    setIsToolbarVisible(false);
    removeToolbarNode();
  }, [removeToolbarNode]);

  const handleDelete = useCallback(() => {
    onDeleteNodes(selectedNodes);
    hideToolbar();
  }, [selectedNodes, onDeleteNodes, hideToolbar]);

  const handleDuplicate = useCallback(() => {
    onDuplicateNodes(selectedNodes);
    hideToolbar();
  }, [selectedNodes, onDuplicateNodes, hideToolbar]);

  const getToolbarData = useCallback(() => {
    return {
      ...TOOLBAR_NODE_BASE,
      data: {
        onDelete: handleDelete,
        onDuplicate: handleDuplicate,
      } as SelectionToolbarProps,
    };
  }, [handleDelete, handleDuplicate]);

  // Mount the toolbar on initial load and record its size
  useEffect(() => {
    console.log("Mounting toolbar");
    if (!reactFlowInstance) return;

    console.log("ReactFlow found");

    reactFlowInstance.addNodes([TOOLBAR_NODE_BASE]);

    // Wait to ensure the node has been rendered
    setTimeout(() => {
      const mountedNode = reactFlowInstance.getNode(SELECTION_TOOLBAR_ID);
      console.log("mountedNode", mountedNode);

      if (mountedNode) {
        const size = {
          width: mountedNode.measured?.width ?? 0,
          height: mountedNode.measured?.height ?? 0,
        };

        console.log("toolbar size", size);

        setToolbarSize(size);
      }

      reactFlowInstance.deleteElements({
        nodes: [{ id: SELECTION_TOOLBAR_ID }],
      });

      console.log("initialization complete");
    }, 1000);
  }, [reactFlowInstance]);

  useEffect(() => {
    console.log("visiblity changed to", isToolbarVisible);
  }, [isToolbarVisible]);

  useEffect(() => {
    if (reactFlowInstance) {
      setTimeout(() => {
        console.log(
          "Toolbar in ReactFlow:",
          reactFlowInstance.getNode(SELECTION_TOOLBAR_ID)?.position // why doesn't the node exist after it has been made?
        );
      }, 1000);
    } else {
      console.log("useeffect - No reactFlowInstance found");
    }

    console.log(isToolbarVisible);
  }, [reactFlowInstance, selectedNodes, isToolbarVisible]);

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
