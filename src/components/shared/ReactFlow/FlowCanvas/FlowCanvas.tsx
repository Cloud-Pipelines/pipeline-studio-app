/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  type Connection,
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
import type {
  ComponentType,
  DragEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
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

import { getDeleteConfirmationDetails } from "./ConfirmationDialogs/DeleteConfirmation";
import { getReplaceConfirmationDetails } from "./ConfirmationDialogs/ReplaceConfirmation";
import SelectionToolbar from "./SelectionToolbar";
import TaskNode from "./TaskNode/TaskNode";
import type { NodesAndEdges } from "./types";
import addTask from "./utils/addTask";
import { duplicateNodes } from "./utils/duplicateNodes";
import { getPositionFromEvent } from "./utils/getPositionFromEvent";
import { getTaskFromEvent } from "./utils/getTaskFromEvent";
import { handleConnection } from "./utils/handleConnection";
import { isNodeCovered } from "./utils/isNodeCovered";
import { isPositionInNode } from "./utils/isPositionInNode";
import { removeEdge } from "./utils/removeEdge";
import { removeNode } from "./utils/removeNode";
import replaceTaskArgumentsInGraphSpec from "./utils/replaceTaskArgumentsInGraphSpec";
import { replaceTaskNode } from "./utils/replaceTaskNode";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: TaskNode,
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

  const {
    handlers: replaceConfirmationHandlers,
    triggerDialog: triggerReplaceConfirmation,
    ...replaceConfirmationProps
  } = useConfirmationDialog();

  const notify = useToastNotification();

  const [showToolbar, setShowToolbar] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Node | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);

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

  /* Existing TaskNodes */
  const onNodeDragStart = useCallback((_event: ReactMouseEvent, node: Node) => {
    setDraggedNode(node);
  }, []);

  const onNodeDragStop = useCallback((_event: ReactMouseEvent, _node: Node) => {
    setDraggedNode(null);
  }, []);

  const onNodeDrag = useCallback(
    (_event: ReactMouseEvent, node: Node) => {
      const coveredNode = nodes
        .filter((existingNode) => existingNode.id !== node.id)
        .find((existingNode) => isNodeCovered(node, existingNode));

      if (coveredNode?.id === replaceTarget?.id) return;

      setReplaceTarget(coveredNode || null);
      setDraggedNode(node); // Set the latest version of the dragged node so it has an updated position and does not jump back to its original position on rerender
    },
    [nodes, replaceTarget, setReplaceTarget],
  );

  /* New Tasks from the Sidebar */
  const onDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const cursorPosition = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (cursorPosition) {
        const hoveredNode = nodes.find((node) =>
          isPositionInNode(node, cursorPosition),
        );

        if (hoveredNode?.id === replaceTarget?.id) return;

        setReplaceTarget(hoveredNode || null);
      }
    },
    [reactFlowInstance, nodes, replaceTarget, setReplaceTarget],
  );

  const onDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();

      const { taskSpec: droppedTask, taskType } = getTaskFromEvent(event);

      if (!taskType) {
        console.error("Dropped task type not identified.");
        return;
      }

      if (!droppedTask && taskType === "task") {
        console.error("Unable to find dropped task.");
        return;
      }

      // Replacing an existing node
      if (replaceTarget) {
        if (!droppedTask) {
          console.error(
            "Replacement by Input or Output node is currently unsupported.",
          );
          return;
        }

        const { updatedGraphSpec, lostInputs, newTaskId } = replaceTaskNode(
          replaceTarget,
          droppedTask,
          graphSpec,
        );

        const dialogData = getReplaceConfirmationDetails(
          replaceTarget,
          newTaskId,
          lostInputs,
        );

        const confirmed = await triggerReplaceConfirmation(dialogData);

        setReplaceTarget(null);

        if (confirmed) {
          updateGraphSpec(updatedGraphSpec);
        }

        return;
      }

      if (reactFlowInstance) {
        const position = getPositionFromEvent(event, reactFlowInstance);

        const newComponentSpec = addTask(
          taskType,
          droppedTask,
          position,
          componentSpec,
        );

        setComponentSpec(newComponentSpec);
        updateReactFlow(newComponentSpec);
      }
    },
    [
      componentSpec,
      reactFlowInstance,
      replaceTarget,
      setComponentSpec,
      updateGraphSpec,
      triggerReplaceConfirmation,
    ],
  );

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

      const updatedNewNodes = newNodes
        .filter((node) => node.id !== draggedNode?.id)
        .map((node) => ({
          ...node,
          data: {
            ...node.data,
            highlighted: node.id === replaceTarget?.id,
          },
        }));

      if (draggedNode) {
        updatedNewNodes.push({
          ...draggedNode,
          data: {
            ...draggedNode.data,
            highlighted: false,
          },
        });
      }

      setNodes((prevNodes) => {
        const updatedNodes = updatedNewNodes.map((newNode) => {
          const existingNode = prevNodes.find((node) => node.id === newNode.id);
          return existingNode ? { ...existingNode, ...newNode } : newNode;
        });

        return updatedNodes;
      });
    },
    [setNodes, nodeData, replaceTarget, draggedNode],
  );

  useEffect(() => {
    // Update ReactFlow based on the component spec
    updateReactFlow(componentSpec);
  }, [componentSpec, replaceTarget]);

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
        onNodeDrag={onNodeDrag}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
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
      {!readOnly && (
        <ConfirmationDialog
          {...replaceConfirmationProps}
          onConfirm={() => replaceConfirmationHandlers?.onConfirm()}
          onCancel={() => replaceConfirmationHandlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowCanvas;
