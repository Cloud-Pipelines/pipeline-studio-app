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
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { ArgumentType } from "@/utils/componentSpec";
import { createNodes, type NodeAndTaskId } from "@/utils/nodes/createNodes";

import TaskNode from "./TaskNode/TaskNode";
import { cleanupDeletedTasks } from "./utils/cleanupDeletedTasks";
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

  const {
    isOpen,
    handlers,
    triggerDialog: triggerConfirmationDialog,
  } = useConfirmationDialog();

  /* Initialize nodes with an empty array and sync with the ComponentSpec via useEffect to avoid infinite renders */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  useEffect(() => {
    const newNodes = createNodes(componentSpec, {
      onDelete,
      setArguments,
    });

    setNodes((prevNodes) => {
      const updatedNodes = newNodes.map((newNode) => {
        const existingNode = prevNodes.find((node) => node.id === newNode.id);
        return existingNode ? { ...existingNode, ...newNode } : newNode;
      });

      return updatedNodes;
    });
  }, [componentSpec]);

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
  };
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

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

      updatedComponentSpec = cleanupDeletedTasks(
        updatedComponentSpec,
        params.nodes,
      );

      setComponentSpec(updatedComponentSpec);
    },
    [componentSpec, setComponentSpec],
  );

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

  const handleSelectionChange = useCallback((params: NodesAndEdges) => {
    const nodes = params.nodes;
    setSelectedNodes(nodes);
  }, []);

  const handleSelectionDragEnd = useCallback(
    (_e: ReactMouseEvent, nodes: Node[]) => {
      setSelectedNodes(nodes);
    },
    [],
  );

  const { title, desc } = getConfirmationDialogText(selectedNodes);

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
        onSelectionDragStop={handleSelectionDragEnd}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        connectOnClick={!readOnly}
      >
        {children}
      </ReactFlow>
      {selectedNodes.length > 0 && !readOnly && (
        <ConfirmationDialog
          title={title}
          description={desc}
          isOpen={isOpen}
          onConfirm={() => handlers?.onConfirm()}
          onCancel={() => handlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowCanvas;

function getConfirmationDialogText(selectedNodes: Node[]) {
  const isDeletingMultipleNodes = selectedNodes.length > 1;

  if (!isDeletingMultipleNodes) {
    const singleDeleteTitle =
      "Delete Node" +
      (selectedNodes.length > 0 ? ` '${selectedNodes[0].id}'` : "") +
      "?";

    const singleDeleteDesc =
      "This will also will also delete all connections to and from the Node. This cannot be undone.";

    return {
      title: singleDeleteTitle,
      desc: singleDeleteDesc,
    };
  }

  const multiDeleteTitle = `Delete Nodes?`;

  const multiDeleteDesc = `Deleting ${
    selectedNodes.length
      ? selectedNodes
          .map((node) => {
            return `'${node.id}'`;
          })
          .join(", ")
      : "nodes"
  } will also delete all connections to and from these nodes. This cannot be undone.`;

  return {
    title: multiDeleteTitle,
    desc: multiDeleteDesc,
  };
}
