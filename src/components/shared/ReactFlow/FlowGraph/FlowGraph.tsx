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
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { ArgumentType } from "@/utils/componentSpec";
import { createNodes, type NodeAndTaskId } from "@/utils/nodes/createNodes";

import ComponentTaskNode from "./TaskNode/TaskNode";
import { cleanupDeletedTasks } from "./utils/cleanupDeletedTasks";
import { handleConnection } from "./utils/handleConnection";
import onDropNode from "./utils/onDropNode";
import { removeEdge } from "./utils/removeEdge";
import { removeNode } from "./utils/removeNode";
import replaceTaskArgumentsInGraphSpec from "./utils/replaceTaskArgumentsInGraphSpec";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: ComponentTaskNode,
};

type NodesAndEdges = {
  nodes: Node[];
  edges: Edge[];
};

const FlowGraph = ({
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
    setNodes(newNodes);
  }, [componentSpec]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
  };

  const onDelete = useCallback(
    async (ids: NodeAndTaskId) => {
      if (readOnly) {
        return;
      }

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
      if (readOnly) {
        return;
      }

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
      if (readOnly) {
        return;
      }

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

    if (readOnly) {
      return;
    }

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
      if (readOnly) {
        return;
      }

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
      >
        {children}
      </ReactFlow>
      {!readOnly && (
        <ConfirmationDialog
          title="Delete Node"
          description="This will also will also delete all connections to and from the Node. This cannot be undone."
          isOpen={isOpen}
          onConfirm={() => handlers?.onConfirm()}
          onCancel={() => handlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowGraph;
