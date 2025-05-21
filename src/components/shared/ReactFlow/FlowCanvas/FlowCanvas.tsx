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
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import type { NodeAndTaskId } from "@/types/taskNode";
import type {
  ArgumentType,
  ComponentReference,
  ComponentSpec,
  InputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { createNodesFromComponentSpec } from "@/utils/nodes/createNodesFromComponentSpec";

import { getBulkUpdateConfirmationDetails } from "./ConfirmationDialogs/BulkUpdateConfirmationDialog";
import { getDeleteConfirmationDetails } from "./ConfirmationDialogs/DeleteConfirmation";
import { getReplaceConfirmationDetails } from "./ConfirmationDialogs/ReplaceConfirmation";
import { getUpgradeConfirmationDetails } from "./ConfirmationDialogs/UpgradeComponent";
import SmoothEdge from "./Edges/SmoothEdge";
import SelectionToolbar from "./SelectionToolbar";
import TaskNode from "./TaskNode/TaskNode";
import type { NodesAndEdges } from "./types";
import addTask from "./utils/addTask";
import { duplicateNodes } from "./utils/duplicateNodes";
import { getPositionFromEvent } from "./utils/getPositionFromEvent";
import { getTaskFromEvent } from "./utils/getTaskFromEvent";
import { handleConnection } from "./utils/handleConnection";
import { isPositionInNode } from "./utils/isPositionInNode";
import { removeEdge } from "./utils/removeEdge";
import { removeNode } from "./utils/removeNode";
import replaceTaskArgumentsInGraphSpec from "./utils/replaceTaskArgumentsInGraphSpec";
import { replaceTaskNode } from "./utils/replaceTaskNode";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: TaskNode,
};
const edgeTypes: Record<string, ComponentType<any>> = {
  customEdge: SmoothEdge,
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
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();

  const notify = useToastNotification();

  const [showToolbar, setShowToolbar] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Node | null>(null);
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setShiftKeyPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setShiftKeyPressed(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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

        const confirmed = await triggerConfirmation(
          getDeleteConfirmationDetails(params),
        );

        if (confirmed) {
          onElementsRemove(params);
        }
      }
    },
    [nodes, edges, componentSpec, setComponentSpec, triggerConfirmation],
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

  const onUpgrade = useCallback(
    async (ids: NodeAndTaskId, newComponentRef: ComponentReference) => {
      const nodeId = ids.nodeId;
      const node = nodes.find((n) => n.id === nodeId);

      if (!node) return;

      const { updatedGraphSpec, lostInputs } = replaceTaskNode(
        node,
        newComponentRef,
        graphSpec,
      );

      if (!newComponentRef.digest) {
        console.error("Component reference does not have a digest.");
        return;
      }

      const dialogData = getUpgradeConfirmationDetails(
        node,
        newComponentRef.digest,
        lostInputs,
      );

      const confirmed = await triggerConfirmation(dialogData);

      if (confirmed) {
        updateGraphSpec(updatedGraphSpec);
        notify("Component updated", "success");
      }
    },
    [graphSpec, nodes, updateGraphSpec],
  );

  const nodeData = {
    readOnly,
    nodeCallbacks: {
      onDelete,
      setArguments,
      onDuplicate,
      onUpgrade,
    },
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      const updatedGraphSpec = handleConnection(graphSpec, connection);
      updateGraphSpec(updatedGraphSpec);
    },
    [graphSpec, handleConnection, updateGraphSpec],
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
          droppedTask.componentRef,
          graphSpec,
        );

        const dialogData = getReplaceConfirmationDetails(
          replaceTarget,
          newTaskId,
          lostInputs,
        );

        const confirmed = await triggerConfirmation(dialogData);

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
      triggerConfirmation,
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
    const confirmed = await triggerConfirmation(
      getDeleteConfirmationDetails({ nodes: selectedNodes, edges: [] }),
    );
    if (confirmed) {
      onElementsRemove(selectedElements);
    }
  }, [selectedElements, onElementsRemove, triggerConfirmation]);

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

    const confirmed = await triggerConfirmation(
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

  const onUpgradeNodes = useCallback(async () => {
    let newGraphSpec = graphSpec;
    const allLostInputs: InputSpec[] = [];
    const includedNodes: Node[] = [];
    const excludedNodes: Node[] = [];

    selectedNodes.forEach((node) => {
      const taskSpec = node.data.taskSpec as TaskSpec | undefined;
      // Custom components don't have a componentRef.url so they are currently excluded from bulk operations
      if (taskSpec?.componentRef && taskSpec.componentRef.url) {
        const { updatedGraphSpec, lostInputs } = replaceTaskNode(
          node,
          taskSpec.componentRef,
          newGraphSpec,
        );

        if (lostInputs.length > 0) {
          allLostInputs.push(...lostInputs);
        }

        includedNodes.push(node);
        newGraphSpec = { ...updatedGraphSpec };
      } else {
        excludedNodes.push(node);
      }
    });

    const dialogData = getBulkUpdateConfirmationDetails(
      includedNodes,
      excludedNodes,
      allLostInputs,
    );

    const confirmed = await triggerConfirmation(dialogData);

    if (confirmed) {
      updateGraphSpec(newGraphSpec);
      notify(`${includedNodes.length} nodes updated`, "success");
    }
  }, [graphSpec, selectedNodes, updateGraphSpec]);

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

      const updatedNewNodes = newNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          highlighted: node.id === replaceTarget?.id,
        },
      }));

      setNodes((prevNodes) => {
        const updatedNodes = updatedNewNodes.map((newNode) => {
          const existingNode = prevNodes.find((node) => node.id === newNode.id);
          return existingNode ? { ...existingNode, ...newNode } : newNode;
        });

        return updatedNodes;
      });
    },
    [setNodes, nodeData, replaceTarget],
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
        nodes={nodes}
        edges={edges}
        minZoom={0.01}
        maxZoom={3}
        onNodesChange={handleOnNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        className={cn(
          (rest.selectionOnDrag || shiftKeyPressed) && "cursor-crosshair",
        )}
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
              onUpgrade={onUpgradeNodes}
            />
          </NodeToolbar>
        )}
        {children}
      </ReactFlow>
      {!readOnly && (
        <ConfirmationDialog
          {...confirmationProps}
          onConfirm={() => confirmationHandlers?.onConfirm()}
          onCancel={() => confirmationHandlers?.onCancel()}
        />
      )}
    </>
  );
};

export default FlowCanvas;
