import {
  type Edge,
  getNodesBounds,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

const SELECTION_TOOLBAR_ID = "selection-toolbar";

export function useSelectionToolbar({
  reactFlowInstance,
  selectedNodes,
  onDeleteNodes,
  onDuplicateNodes,
}: {
  reactFlowInstance?: ReactFlowInstance;
  selectedNodes: Node[];
  onDeleteNodes: (params: { nodes: Node[]; edges: Edge[] }) => void;
  onDuplicateNodes: (nodes: Node[]) => void;
}) {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const showToolbar = useCallback(() => {
    setIsToolbarVisible(true);
  }, []);

  const hideToolbar = useCallback(() => {
    setIsToolbarVisible(false);
  }, []);

  const onDelete = useCallback(() => {
    onDeleteNodes({ nodes: selectedNodes, edges: [] });
    hideToolbar();
  }, [selectedNodes, onDeleteNodes, hideToolbar]);

  const onDuplicate = useCallback(() => {
    onDuplicateNodes(selectedNodes);
    hideToolbar();
  }, [selectedNodes, onDuplicateNodes, hideToolbar]);

  useEffect(() => {
    if (reactFlowInstance) {
      if (isToolbarVisible) {
        const bounds = getNodesBounds(selectedNodes);
        const toolbarNodeId = SELECTION_TOOLBAR_ID;

        if (bounds) {
          const toolbarPreRenderCoordinates = {
            x: -1000 - Math.abs(bounds.x) - Math.abs(bounds.width),
            y: -1000 - Math.abs(bounds.y) - Math.abs(bounds.height),
          };

          const toolbarNode = {
            id: toolbarNodeId,
            type: "toolbar",
            position: toolbarPreRenderCoordinates,
            zIndex: 1200,
            data: {
              onDelete,
              onDuplicate,
            },
          };

          const existingToolbarNode = reactFlowInstance.getNode(toolbarNodeId);

          if (!existingToolbarNode) {
            reactFlowInstance.addNodes(toolbarNode);
          } else {
            reactFlowInstance.setNodes((nodes: Node[]) =>
              nodes.map((node) =>
                node.id === toolbarNodeId
                  ? {
                      ...node,
                      position: toolbarPreRenderCoordinates,
                    }
                  : node,
              ),
            );
          }
        }

        setTimeout(() => {
          const toolbarNode = reactFlowInstance.getNode(toolbarNodeId);
          if (toolbarNode) {
            reactFlowInstance.setNodes((nodes: Node[]) =>
              nodes.map((node) =>
                node.id === toolbarNodeId
                  ? {
                      ...node,
                      position: {
                        x:
                          bounds.x +
                          bounds.width -
                          (toolbarNode?.measured?.width ?? 0),
                        y: bounds.y - (toolbarNode?.measured?.height ?? 0),
                      },
                    }
                  : node,
              ),
            );
          }
        }, 0);
      } else {
        reactFlowInstance.setNodes((nodes: Node[]) =>
          nodes.filter((node) => node.id !== SELECTION_TOOLBAR_ID),
        );
      }
    }
  }, [
    isToolbarVisible,
    reactFlowInstance,
    selectedNodes,
    onDelete,
    onDuplicate,
  ]);

  return {
    showToolbar,
    hideToolbar,
    isToolbarVisible,
  };
}
