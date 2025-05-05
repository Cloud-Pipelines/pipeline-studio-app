/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnInit,
  ReactFlow,
  type ReactFlowInstance,
  type ReactFlowProps,
  useNodesState,
  useStoreApi,
} from "@xyflow/react";
import type {
  ComponentType,
  DragEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useCallback, useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import { useSelectionToolbar } from "@/hooks/useSelectionToolbar";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { NodeAndTaskId } from "@/types/taskNode";
import type { ArgumentType } from "@/utils/componentSpec";
import { SELECTION_TOOLBAR_ID } from "@/utils/constants";
import { createNodesFromComponentSpec } from "@/utils/nodes/createNodesFromComponentSpec";

import SelectionToolbar from "./SelectionToolbar";
import TaskNode from "./TaskNode/TaskNode";
import { duplicateNodes } from "./utils/duplicateNodes";
import { handleConnection } from "./utils/handleConnection";
import onDropNode from "./utils/onDropNode";
import { removeEdge } from "./utils/removeEdge";
import { removeNode } from "./utils/removeNode";
import replaceTaskArgumentsInGraphSpec from "./utils/replaceTaskArgumentsInGraphSpec";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: TaskNode,
  toolbar: SelectionToolbar,
};

type NodesAndEdges = {
  nodes: Node[];
  edges: Edge[];
};

const FlowCanvas = ({
  readOnly,
  children,
  ...rest
}: ReactFlowProps & { readOnly?: boolean }) => {
  const { componentSpec, setComponentSpec, graphSpec, updateGraphSpec } =
    useComponentSpec();
  const { edges, onEdgesChange } = useComponentSpecToEdges(componentSpec);

  const {
    isOpen,
    handlers,
    triggerDialog: triggerConfirmationDialog,
  } = useConfirmationDialog();

  const notify = useToastNotification();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [selectedElements, setSelectedElements] = useState<NodesAndEdges>({
    nodes: [],
    edges: [],
  });

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
  };

  const updateOrAddNodes = useCallback(
    ({
      updatedNodes,
      newNodes,
    }: {
      updatedNodes?: Node[];
      newNodes?: Node[];
    }) => {
      setNodes((prev) => {
        const updated = prev.map((node) => {
          const updatedNode = updatedNodes?.find(
            (updatedNode) => updatedNode.id === node.id,
          );
          return updatedNode ? { ...node, ...updatedNode } : node;
        });

        if (!newNodes) {
          return updated;
        }

        return [...updated, ...newNodes];
      });
    },
    [setNodes],
  );

  const onDelete = useCallback(
    async (ids: NodeAndTaskId) => {
      const nodeId = ids.nodeId;
      const node = nodes.find((n) => n.id === nodeId);
      const edgesToRemove = edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      );

      if (node) {
        const confirmed = await triggerConfirmationDialog();
        if (confirmed) {
          const params = {
            nodes: [node],
            edges: edgesToRemove,
          } as NodesAndEdges;

          onElementsRemove(params);
        }
      }
    },
    [nodes, edges, componentSpec, setComponentSpec, triggerConfirmationDialog],
  );

  const setArguments = useCallback(
    (ids: NodeAndTaskId, args: Record<string, ArgumentType>) => {
      const taskId = ids.taskId;
      const newGraphSpec = replaceTaskArgumentsInGraphSpec(
        taskId,
        graphSpec,
        args,
      );
      updateGraphSpec(newGraphSpec);
    },
    [graphSpec],
  );

  const onDuplicate = useCallback(
    (ids: NodeAndTaskId, selected = true) => {
      const nodeId = ids.nodeId;
      const node = nodes.find((n) => n.id === nodeId);

      if (!node) return;

      const { updatedGraphSpec, newNodes, updatedNodes } = duplicateNodes(
        graphSpec,
        [node],
        { selected },
      );

      updateGraphSpec(updatedGraphSpec);

      updateOrAddNodes({
        updatedNodes,
        newNodes,
      });
    },
    [graphSpec, nodes, updateGraphSpec, updateOrAddNodes],
  );

  const nodeData = {
    readOnly,
    nodeCallbacks: {
      onDelete,
      setArguments,
      onDuplicate,
    },
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      const updatedGraphSpec = handleConnection(graphSpec, connection);
      updateGraphSpec(updatedGraphSpec);
    },
    [graphSpec, handleConnection, updateGraphSpec],
  );

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const newComponentSpec = onDropNode(
        event,
        reactFlowInstance,
        componentSpec,
      );
      setComponentSpec(newComponentSpec);
    }
  };

  const onElementsRemove = useCallback(
    (params: NodesAndEdges) => {
      let updatedComponentSpec = { ...componentSpec };

      for (const edge of params.edges) {
        updatedComponentSpec = removeEdge(edge, updatedComponentSpec);
      }
      for (const node of params.nodes) {
        updatedComponentSpec = removeNode(node, updatedComponentSpec);
      }

      setComponentSpec(updatedComponentSpec);
    },
    [componentSpec, setComponentSpec],
  );

  const onRemoveNodes = useCallback(async () => {
    const confirmed = await triggerConfirmationDialog();
    if (confirmed) {
      onElementsRemove(selectedElements);
    }
  }, [selectedElements, onElementsRemove]);

  const handleOnNodesChange = (changes: NodeChange[]) => {
    const positionChanges = changes.filter(
      (change) => change.type === "position" && change.dragging === false,
    );

    if (positionChanges.length > 0) {
      const updatedNodes = positionChanges
        .map((change) => {
          if ("id" in change && "position" in change) {
            const node = nodes.find((n) => n.id === change.id);
            return node
              ? {
                  ...node,
                  position: { x: change?.position?.x, y: change?.position?.y },
                }
              : null;
          }
          return null;
        })
        .filter(Boolean) as Node[];

      if (updatedNodes.length > 0) {
        const updatedComponentSpec = updateNodePositions(
          updatedNodes,
          componentSpec,
        );
        setComponentSpec(updatedComponentSpec);
      }
    }

    onNodesChange(changes);
  };

  const handleBeforeDelete = async (params: NodesAndEdges) => {
    if (params.nodes.length === 0 && params.edges.length === 0) {
      return false;
    }

    const confirmed = await triggerConfirmationDialog();
    return confirmed;
  };

  const onDuplicateNodes = useCallback(() => {
    const { updatedGraphSpec, newNodes, updatedNodes } = duplicateNodes(
      graphSpec,
      selectedElements.nodes,
      { selected: true },
    );

    updateGraphSpec(updatedGraphSpec);

    updateOrAddNodes({
      updatedNodes,
      newNodes,
    });

    // Workaround: return the new nodes directly to the callbackhandler (which is inside useSelectionToolbar) so that the toolbar position can be updated
    // Without this the toolbar will not automatically shift to the newly copied nodes
    return newNodes;
  }, [graphSpec, selectedElements, updateGraphSpec, updateOrAddNodes]);

  const { toolbar, hideToolbar, showToolbar, updateToolbarPosition } =
    useSelectionToolbar({
      reactFlowInstance,
      onDeleteNodes: onRemoveNodes,
      onDuplicateNodes: onDuplicateNodes,
    });

  const handleSelectionChange = useCallback(
    (params: NodesAndEdges) => {
      setSelectedElements(params);

      const nodes = params.nodes;
      if (nodes.length < 1) {
        hideToolbar();
      } else {
        updateToolbarPosition(nodes);
      }
    },
    [hideToolbar, updateToolbarPosition],
  );

  const handleSelectionEnd = useCallback(() => {
    if (selectedElements.nodes.length > 0 && !readOnly) {
      showToolbar(selectedElements.nodes);
    } else {
      hideToolbar();
    }
  }, [selectedElements]);

  const handleSelectionDrag = useCallback(
    (_e: ReactMouseEvent, nodes: Node[]) => {
      if (toolbar.data.hidden) return;

      // If the toolbar is visible update its position so it stays attached to the selection box
      updateToolbarPosition(nodes);
    },
    [toolbar, updateToolbarPosition],
  );

  const handleSelectionDragEnd = useCallback(
    (_e: ReactMouseEvent, nodes: Node[]) => {
      setSelectedElements((prev) => ({
        ...prev,
        nodes: nodes,
      }));
    },
    [],
  );

  useEffect(() => {
    // Update ReactFlow based on the component spec
    const newNodes = createNodesFromComponentSpec(componentSpec, nodeData);

    setNodes((prevNodes) => {
      const updatedNodes = newNodes.map((newNode) => {
        const existingNode = prevNodes.find((node) => node.id === newNode.id);
        return existingNode ? { ...existingNode, ...newNode } : newNode;
      });

      // If the toolbar is in the previous node list, migrate it to the new one
      const existingToolbarNode = prevNodes.find(
        (node) => node.id === SELECTION_TOOLBAR_ID,
      );

      if (existingToolbarNode) {
        return [...updatedNodes, { ...existingToolbarNode }];
      }

      return updatedNodes;
    });
  }, [componentSpec]);

  useEffect(() => {
    // Update the toolbar node with the latest props
    setNodes((prevNodes) => {
      const existingToolbarNode = prevNodes.find(
        (node) => node.id === SELECTION_TOOLBAR_ID,
      );

      if (existingToolbarNode) {
        return prevNodes.map((node) =>
          node.id === SELECTION_TOOLBAR_ID ? { ...node, ...toolbar } : node,
        );
      }

      return [...prevNodes, { ...toolbar }];
    });
  }, [toolbar]);

  const store = useStoreApi();

  const onCopy = useCallback(() => {
    // Copy selected nodes to clipboard
    if (selectedElements.nodes.length > 0) {
      const selectedNodesJson = JSON.stringify(selectedElements.nodes);
      navigator.clipboard.writeText(selectedNodesJson).catch((err) => {
        console.error("Failed to copy nodes to clipboard:", err);
      });
      const message = `Copied ${selectedElements.nodes.length} nodes to clipboard`;
      notify(message, "success");
    }
  }, [selectedElements]);

  const onPaste = useCallback(() => {
    if (readOnly) return;

    // Paste nodes from clipboard to the centre of the Canvas
    navigator.clipboard.readText().then((clipboardText) => {
      try {
        let parsedData;
        try {
          parsedData = JSON.parse(clipboardText);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          return;
        }

        const nodesToPaste: Node[] = parsedData;

        // Get the center of the canvas
        const { domNode } = store.getState();
        const boundingRect = domNode?.getBoundingClientRect();

        if (boundingRect) {
          const center = reactFlowInstance?.screenToFlowPosition({
            x: boundingRect.x + boundingRect.width / 2,
            y: boundingRect.y + boundingRect.height / 2,
          });

          const reactFlowCenter = {
            x: center?.x || 0,
            y: center?.y || 0,
          };

          const { newNodes, updatedGraphSpec } = duplicateNodes(
            graphSpec,
            nodesToPaste,
            { position: reactFlowCenter, connection: "internal" },
          );

          // Deselect all existing nodes
          const updatedNodes = nodes.map((node) => ({
            ...node,
            selected: false,
          }));

          updateOrAddNodes({
            updatedNodes,
            newNodes,
          });

          updateGraphSpec(updatedGraphSpec);
        }
      } catch (err) {
        console.error("Failed to paste nodes from clipboard:", err);
      }
    });
  }, [graphSpec, nodes, reactFlowInstance, store, updateOrAddNodes]);

  useCopyPaste({
    onCopy,
    onPaste,
  });

  const { title, content } = getConfirmationDialogDetails(selectedElements);

  const nodesWithoutToolbar = nodes.filter(
    (node) => node.id !== SELECTION_TOOLBAR_ID,
  );

  return (
    <>
      <ReactFlow
        {...rest}
        nodes={nodes}
        edges={edges}
        onNodesChange={handleOnNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onBeforeDelete={handleBeforeDelete}
        onDelete={onElementsRemove}
        onInit={onInit}
        deleteKeyCode={["Delete", "Backspace"]}
        onSelectionChange={handleSelectionChange}
        onSelectionEnd={handleSelectionEnd}
        onSelectionDrag={handleSelectionDrag}
        onSelectionDragStop={handleSelectionDragEnd}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        connectOnClick={!readOnly}
        fitView
        fitViewOptions={{
          nodes: nodesWithoutToolbar,
        }}
      >
        {children}
      </ReactFlow>
      {!readOnly && (
        <ConfirmationDialog
          title={title}
          description=""
          content={content}
          isOpen={isOpen}
          onConfirm={() => handlers?.onConfirm()}
          onCancel={() => handlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowCanvas;

function getConfirmationDialogDetails(selectedElements: NodesAndEdges) {
  const selectedNodes = selectedElements.nodes;
  const selectedEdges = selectedElements.edges;

  const thisCannotBeUndone = (
    <p className="text-muted-foreground">This cannot be undone.</p>
  );

  if (selectedNodes.length > 0) {
    const isDeletingMultipleNodes = selectedNodes.length > 1;

    if (!isDeletingMultipleNodes) {
      const singleDeleteTitle =
        "Delete Node" +
        (selectedNodes.length > 0 ? ` '${selectedNodes[0].id}'` : "") +
        "?";

      const singleDeleteDesc = (
        <div className="text-sm">
          <p>This will also delete all connections to and from the Node.</p>
          <br />
          {thisCannotBeUndone}
        </div>
      );

      return {
        title: singleDeleteTitle,
        content: singleDeleteDesc,
      };
    }

    const multiDeleteTitle = `Delete Nodes?`;

    const multiDeleteDesc = (
      <div className="text-sm">
        <p>{`
          Deleting
          ${selectedNodes
            .map((node) => {
              return `'${node.id}'`;
            })
            .join(
              ", ",
            )} will also remove all connections to and from these nodes.`}</p>
        <br />
        {thisCannotBeUndone}
      </div>
    );

    return {
      title: multiDeleteTitle,
      content: multiDeleteDesc,
    };
  }

  if (selectedEdges.length > 0) {
    const isDeletingMultipleEdges = selectedEdges.length > 1;

    const edgeDeleteTitle = isDeletingMultipleEdges
      ? "Delete Connections?"
      : "Delete Connection?";

    const edgeDeleteDesc = (
      <div className="text-sm">
        <p>This will remove the follow connections between task nodes:</p>
        <p>
          {selectedEdges
            .map((edge) => {
              return `'${edge.id}'`;
            })
            .join(", ")}
        </p>
        <br />
        {thisCannotBeUndone}
      </div>
    );

    return {
      title: edgeDeleteTitle,
      content: edgeDeleteDesc,
    };
  }

  return {
    title: "",
    content: "",
  };
}
