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
import type { ArgumentType } from "@/utils/componentSpec";
import { SELECTION_TOOLBAR_ID } from "@/utils/constants";
import { copyToNewTaskNode } from "@/utils/nodes/copyToNewTaskNode";
import { createNodesFromComponentSpec } from "@/utils/nodes/createNodesFromComponentSpec";
import { createTaskNode } from "@/utils/nodes/createTaskNode";
import { duplicateTask } from "@/utils/nodes/duplicateTask";
import type { NodeAndTaskId } from "@/utils/nodes/generateDynamicNodeCallbacks";
import { nodeIdToTaskId, taskIdToNodeId } from "@/utils/nodes/nodeIdUtils";

import SelectionToolbar from "./SelectionToolbar";
import TaskNode from "./TaskNode/TaskNode";
import { duplicateSelectedNodes } from "./utils/duplicateSelectedNodes";
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
      const taskId = ids.taskId;
      const { newTaskId, updatedGraphSpec } = duplicateTask(taskId, graphSpec);

      updateGraphSpec(updatedGraphSpec);

      if (selected) {
        // Move selection state to the new node
        const newNode = createTaskNode(
          [newTaskId, updatedGraphSpec.tasks[newTaskId]],
          !!readOnly,
          {
            onDelete,
            setArguments,
            onDuplicate,
          },
        );

        setNodes((prev) => {
          const originalNode = prev.find(
            (node) => node.id === taskIdToNodeId(taskId),
          );

          if (!originalNode) {
            return [...prev, newNode];
          }

          originalNode.selected = false;
          newNode.selected = true;

          const updatedNodes = prev.map((node) =>
            node.id === taskIdToNodeId(taskId) ? originalNode : node,
          );

          return [...updatedNodes, newNode];
        });
      }
    },
    [graphSpec, updateGraphSpec, setNodes],
  );

  const nodeCallbacks = {
    onDelete,
    setArguments,
    onDuplicate,
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

  const removeNodes = useCallback(async () => {
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

  const duplicateNodes = useCallback(() => {
    const { updatedGraphSpec, taskIdMap } = duplicateSelectedNodes(
      graphSpec,
      selectedElements.nodes,
    );

    updateGraphSpec(updatedGraphSpec);

    const updatedNodes: Node[] = [];

    const newNodes = Object.entries(taskIdMap)
      .map(([oldTaskId, newTaskId]) => {
        const newNode = createTaskNode(
          [newTaskId, updatedGraphSpec.tasks[newTaskId]],
          !!readOnly,
          {
            onDelete,
            setArguments,
            onDuplicate,
          },
        );

        const originalNode = selectedElements.nodes.find(
          (node) => nodeIdToTaskId(node.id) === oldTaskId,
        );

        if (originalNode) {
          originalNode.selected = false;

          newNode.measured = originalNode.measured;
          newNode.selected = true;

          updatedNodes.push(originalNode);
        }

        return newNode;
      })
      .filter(Boolean) as Node[];

    setNodes((prev) => {
      const updated = prev.map((node) => {
        const updatedNode = updatedNodes.find(
          (updatedNode) => updatedNode.id === node.id,
        );
        return updatedNode ? { ...node, ...updatedNode } : node;
      });

      return [...updated, ...newNodes];
    });

    // Workaround: return the new nodes directly to the callbackhandler (which is inside useSelectionToolbar) so that the toolbar position can be updated
    // Without this the toolbar will not automatically shift to the newly copied nodes
    return newNodes;
  }, [graphSpec, selectedElements, updateGraphSpec, setNodes]);

  const { toolbar, hideToolbar, showToolbar, updateToolbarPosition } =
    useSelectionToolbar({
      reactFlowInstance,
      onDeleteNodes: removeNodes,
      onDuplicateNodes: duplicateNodes,
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
    if (selectedElements.nodes.length > 0) {
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
    const newNodes = createNodesFromComponentSpec(
      componentSpec,
      !!readOnly,
      nodeCallbacks,
    );

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

          // Deselect all currently selected nodes
          Object.keys(graphSpec.tasks).forEach((taskId) => {
            const task = graphSpec.tasks[taskId];
            if (task.annotations?.selected) {
              task.annotations.selected = false;
            }
          });

          let updatedGraphSpec = { ...graphSpec };

          const newNodes = nodesToPaste.map((node) => {
            const output = copyToNewTaskNode(
              node,
              nodeCallbacks,
              reactFlowCenter,
              updatedGraphSpec,
            );
            updatedGraphSpec = output.updatedGraphSpec;

            return output.newNode;
          });

          setNodes((prevNodes) => [...prevNodes, ...newNodes]);
          updateGraphSpec(updatedGraphSpec);
        }
      } catch (err) {
        console.error("Failed to paste nodes from clipboard:", err);
      }
    });
  }, [graphSpec, reactFlowInstance, store, setNodes, nodeCallbacks]);

  useCopyPaste({
    onCopy,
    onPaste,
  });

  const { title, content } = getConfirmationDialogDetails(selectedElements);

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
          <p>
            This will also will also delete all connections to and from the
            Node.
          </p>
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
