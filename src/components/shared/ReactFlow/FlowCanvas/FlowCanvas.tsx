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
  NodeToolbar,
  type OnInit,
  ReactFlow,
  type ReactFlowInstance,
  type ReactFlowProps,
  useNodesState,
  useStoreApi,
} from "@xyflow/react";
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { NodeAndTaskId } from "@/types/taskNode";
import type { ArgumentType, ComponentSpec } from "@/utils/componentSpec";
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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const {
    handlers: deleteConfirmationHandlers,
    triggerDialog: triggerDeleteConfirmation,
    ...deleteConfirmationProps
  } = useConfirmationDialog();

  const notify = useToastNotification();

  const [showToolbar, setShowToolbar] = useState(false);

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

  const selectedNodes = useMemo(
    () => nodes.filter((node) => node.selected),
    [nodes],
  );
  const selectedEdges = useMemo(
    () => edges.filter((edge) => edge.selected),
    [edges],
  );

  const selectedElements = useMemo(
    () => ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }),
    [selectedNodes, selectedEdges],
  );

  const onDelete = useCallback(
    async (ids: NodeAndTaskId) => {
      const nodeId = ids.nodeId;
      const node = nodes.find((n) => n.id === nodeId);
      const edgesToRemove = edges.filter(
        (edge) => edge.source === nodeId || edge.target === nodeId,
      );

      if (node) {
        const params = {
          nodes: [node],
          edges: edgesToRemove,
        } as NodesAndEdges;

        const confirmed = await triggerDeleteConfirmation(
          getDeleteConfirmationDetails(params),
        );

        if (confirmed) {
          onElementsRemove(params);
        }
      }
    },
    [nodes, edges, componentSpec, setComponentSpec, triggerDeleteConfirmation],
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
      updateReactFlow(newComponentSpec);
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
    const confirmed = await triggerDeleteConfirmation(
      getDeleteConfirmationDetails({ nodes: selectedNodes, edges: [] }),
    );
    if (confirmed) {
      onElementsRemove(selectedElements);
    }
  }, [selectedElements, onElementsRemove, triggerDeleteConfirmation]);

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

    const confirmed = await triggerDeleteConfirmation(
      getDeleteConfirmationDetails(params),
    );
    return confirmed;
  };

  const onDuplicateNodes = useCallback(() => {
    const { updatedGraphSpec, newNodes, updatedNodes } = duplicateNodes(
      graphSpec,
      selectedNodes,
      { selected: true },
    );

    updateGraphSpec(updatedGraphSpec);

    updateOrAddNodes({
      updatedNodes,
      newNodes,
    });
  }, [graphSpec, selectedNodes, updateGraphSpec, setNodes]);

  const handleSelectionChange = useCallback(() => {
    if (selectedNodes.length < 1) {
      setShowToolbar(false);
    }
  }, [selectedNodes]);

  const handleSelectionEnd = useCallback(() => {
    setShowToolbar(true);
  }, []);

  const updateReactFlow = useCallback(
    (newComponentSpec: ComponentSpec) => {
      const newNodes = createNodesFromComponentSpec(newComponentSpec, nodeData);

      setNodes((prevNodes) => {
        const updatedNodes = newNodes.map((newNode) => {
          const existingNode = prevNodes.find((node) => node.id === newNode.id);
          return existingNode ? { ...existingNode, ...newNode } : newNode;
        });

        return updatedNodes;
      });
    },
    [setNodes, nodeData],
  );

  useEffect(() => {
    // Update ReactFlow based on the component spec
    updateReactFlow(componentSpec);
  }, [componentSpec]);

  const store = useStoreApi();

  const onCopy = useCallback(() => {
    // Copy selected nodes to clipboard
    if (selectedNodes.length > 0) {
      const selectedNodesJson = JSON.stringify(selectedNodes);
      navigator.clipboard.writeText(selectedNodesJson).catch((err) => {
        console.error("Failed to copy nodes to clipboard:", err);
      });
      const message = `Copied ${selectedNodes.length} nodes to clipboard`;
      notify(message, "success");
    }
  }, [selectedNodes]);

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

  return (
    <>
      <ReactFlow
        {...rest}
        fitView
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
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        connectOnClick={!readOnly}
      >
        {!readOnly && (
          <NodeToolbar
            nodeId={selectedNodes.map((node) => node.id)}
            isVisible={showToolbar}
            offset={0}
            align="end"
          >
            <SelectionToolbar
              onDelete={onRemoveNodes}
              onDuplicate={onDuplicateNodes}
            />
          </NodeToolbar>
        )}
        {children}
      </ReactFlow>
      {!readOnly && (
        <ConfirmationDialog
          {...deleteConfirmationProps}
          onConfirm={() => deleteConfirmationHandlers?.onConfirm()}
          onCancel={() => deleteConfirmationHandlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowCanvas;

function getDeleteConfirmationDetails(deletedElements: NodesAndEdges) {
  const deletedNodes = deletedElements.nodes;
  const deletedEdges = deletedElements.edges;

  const thisCannotBeUndone = (
    <p className="text-muted-foreground">This cannot be undone.</p>
  );

  if (deletedNodes.length > 0) {
    const isDeletingMultipleNodes = deletedNodes.length > 1;

    if (!isDeletingMultipleNodes) {
      const singleDeleteTitle =
        "Delete Node" +
        (deletedNodes.length > 0 ? ` '${deletedNodes[0].id}'` : "") +
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
        description: "",
      };
    }

    const multiDeleteTitle = `Delete Nodes?`;

    const multiDeleteDesc = (
      <div className="text-sm">
        <p>{`
          Deleting
          ${deletedNodes
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
      description: "",
    };
  }

  if (deletedEdges.length > 0) {
    const isDeletingMultipleEdges = deletedEdges.length > 1;

    const edgeDeleteTitle = isDeletingMultipleEdges
      ? "Delete Connections?"
      : "Delete Connection?";

    const edgeDeleteDesc = (
      <div className="text-sm">
        <p>This will remove the follow connections between task nodes:</p>
        <p>
          {deletedEdges
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
      description: "",
    };
  }

  // Fallback to default
  return {};
}
