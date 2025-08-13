import {
  type Connection,
  type FinalConnectionState,
  type Node,
  type NodeChange,
  NodeToolbar,
  type OnInit,
  ReactFlow,
  type ReactFlowInstance,
  type ReactFlowProps,
  useConnection,
  useNodesState,
  useStoreApi,
} from "@xyflow/react";
import type { ComponentType, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import useComponentSpecToEdges from "@/hooks/useComponentSpecToEdges";
import useComponentUploader from "@/hooks/useComponentUploader";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import { useGhostNode } from "@/hooks/useGhostNode";
import { useHintNode } from "@/hooks/useHintNode";
import { useNodeCallbacks } from "@/hooks/useNodeCallbacks";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useContextPanel } from "@/providers/ContextPanelProvider";
import type {
  ComponentReference,
  ComponentSpec,
  InputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import { loadComponentAsRefFromText } from "@/utils/componentStore";
import createNodesFromComponentSpec from "@/utils/nodes/createNodesFromComponentSpec";

import ComponentDuplicateDialog from "../../Dialogs/ComponentDuplicateDialog";
import { getBulkUpdateConfirmationDetails } from "./ConfirmationDialogs/BulkUpdateConfirmationDialog";
import { getDeleteConfirmationDetails } from "./ConfirmationDialogs/DeleteConfirmation";
import { getReplaceConfirmationDetails } from "./ConfirmationDialogs/ReplaceConfirmation";
import SmoothEdge from "./Edges/SmoothEdge";
import GhostNode from "./GhostNode/GhostNode";
import HintNode from "./GhostNode/HintNode";
import IONode from "./IONode/IONode";
import SelectionToolbar from "./SelectionToolbar";
import TaskNode from "./TaskNode/TaskNode";
import type { NodesAndEdges } from "./types";
import { addAndConnectNode } from "./utils/addAndConnectNode";
import addTask from "./utils/addTask";
import { duplicateNodes } from "./utils/duplicateNodes";
import { getPositionFromEvent } from "./utils/getPositionFromEvent";
import { getTaskFromEvent } from "./utils/getTaskFromEvent";
import { handleConnection } from "./utils/handleConnection";
import { isPositionInNode } from "./utils/isPositionInNode";
import { removeEdge } from "./utils/removeEdge";
import { removeNode } from "./utils/removeNode";
import { replaceTaskNode } from "./utils/replaceTaskNode";
import { updateNodePositions } from "./utils/updateNodePosition";

const nodeTypes: Record<string, ComponentType<any>> = {
  task: TaskNode,
  hint: HintNode,
  ghost: GhostNode,
  input: IONode,
  output: IONode,
};
const edgeTypes: Record<string, ComponentType<any>> = {
  customEdge: SmoothEdge,
};

const FlowCanvas = ({
  readOnly,
  nodesConnectable,
  children,
  ...rest
}: ReactFlowProps & { readOnly?: boolean }) => {
  const { clearContent } = useContextPanel();
  const { componentSpec, setComponentSpec, graphSpec, updateGraphSpec } =
    useComponentSpec();
  const { edges, onEdgesChange } = useComponentSpecToEdges(componentSpec);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const isConnecting = useConnection((connection) => connection.inProgress);
  const { ghostNode, handleTabCycle } = useGhostNode();

  const tabHintNode = useHintNode({
    key: "TAB",
    hint: "cycle compatible components",
  });

  const allNodes = useMemo(() => {
    if (readOnly) return nodes;
    if (ghostNode) {
      return [...nodes, ghostNode];
    } else if (tabHintNode) {
      return [...nodes, tabHintNode];
    }
    return nodes;
  }, [readOnly, nodes, ghostNode, tabHintNode]);

  const {
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();

  const notify = useToastNotification();

  const latestFlowPosRef = useRef<{ x: number; y: number } | null>(null);

  const [showToolbar, setShowToolbar] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Node | null>(null);
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setShiftKeyPressed(true);
      }

      if (event.key === "Tab") {
        const direction = event.shiftKey ? "back" : "forward";
        const handled = handleTabCycle(direction);
        if (handled) {
          event.preventDefault();
        }
      }

      if (event.key === "a" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();

        const nodeTypesToSelect = ["task", "input", "output"];
        setNodes((currentNodes) =>
          currentNodes.map((node) => ({
            ...node,
            selected:
              event.shiftKey || !node.type
                ? false
                : nodeTypesToSelect.includes(node.type),
          })),
        );
      }
    },
    [handleTabCycle, setNodes],
  );

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

  const reactFlowInstanceRef = useRef<ReactFlowInstance>(undefined);

  const onInit: OnInit = (instance) => {
    reactFlowInstanceRef.current = instance;
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
    () => nodes.filter((node) => node.selected && node.type === "task"),
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

  const nodeCallbacks = useNodeCallbacks({
    reactFlowInstanceRef,
    triggerConfirmation,
    onElementsRemove,
    updateOrAddNodes,
  });

  const nodeData = useMemo(
    () => ({
      connectable: !readOnly && !!nodesConnectable,
      readOnly,
      nodeCallbacks,
    }),
    [readOnly, nodesConnectable, nodeCallbacks],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) return;

      const updatedGraphSpec = handleConnection(graphSpec, connection);
      updateGraphSpec(updatedGraphSpec);
    },
    [graphSpec, handleConnection, updateGraphSpec],
  );

  const onConnectEnd = useCallback(
    (_e: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (connectionState.isValid) {
        // Valid connections are handled by onConnect
        return;
      }

      const ghostNode = reactFlowInstanceRef.current
        ?.getNodes()
        .find((node) => node.type === "ghost");

      if (!ghostNode) {
        return;
      }

      const { componentRef } = ghostNode.data as {
        componentRef: ComponentReference;
      };

      const position = latestFlowPosRef.current;
      if (!position) return;

      let newComponentSpec = { ...componentSpec };
      const fromHandle = connectionState.fromHandle;

      const existingInputEdge = reactFlowInstanceRef.current
        ?.getEdges()
        .find(
          (edge) =>
            edge.target === fromHandle?.nodeId &&
            edge.targetHandle === fromHandle.id,
        );

      if (existingInputEdge) {
        newComponentSpec = removeEdge(existingInputEdge, newComponentSpec);
      }

      const updatedComponentSpec = addAndConnectNode({
        componentRef,
        fromHandle,
        position,
        componentSpec: newComponentSpec,
      });

      setComponentSpec(updatedComponentSpec);
    },
    [
      reactFlowInstanceRef,
      componentSpec,
      nodeData,
      setComponentSpec,
      updateOrAddNodes,
    ],
  );

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (isConnecting && reactFlowInstanceRef.current) {
        const flowPos = reactFlowInstanceRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        latestFlowPosRef.current = flowPos;
      }
    }
    if (isConnecting) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isConnecting, reactFlowInstanceRef]);

  const {
    handleDrop,
    existingAndNewComponent,
    handleCancelUpload,
    handleImportComponent,
  } = useComponentUploader(readOnly, {
    onImportSuccess: async (
      content: string,
      dropEvent?: DragEvent<HTMLDivElement>,
    ) => {
      if (readOnly) return;

      try {
        // Parse the imported YAML to get the component spec
        const componentRef = await loadComponentAsRefFromText(content);

        if (!componentRef.spec) {
          console.error("Failed to parse component spec from imported content");
          return;
        }

        let position;

        if (dropEvent && reactFlowInstanceRef.current) {
          // Use the drop position if available
          position = getPositionFromEvent(
            dropEvent,
            reactFlowInstanceRef.current,
          );
        } else {
          // Fallback to center of the canvas viewport
          const { domNode } = store.getState();
          const boundingRect = domNode?.getBoundingClientRect();

          if (boundingRect && reactFlowInstanceRef.current) {
            position = reactFlowInstanceRef.current.screenToFlowPosition({
              x: boundingRect.x + boundingRect.width / 2,
              y: boundingRect.y + boundingRect.height / 2,
            });
          }
        }

        if (position) {
          const taskSpec: TaskSpec = {
            annotations: {},
            componentRef: { ...componentRef },
          };
          const newComponentSpec = addTask(
            "task",
            taskSpec,
            position,
            componentSpec,
          );

          setComponentSpec(newComponentSpec);
          updateReactFlow(newComponentSpec);
        }
      } catch (error) {
        console.error("Failed to add imported component to canvas:", error);
        notify("Failed to add component to canvas", "error");
      }
    },
  });

  const onDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // Check if we're dragging files
      const hasFiles = event.dataTransfer.types.includes("Files");
      if (hasFiles) {
        return;
      }

      event.dataTransfer.dropEffect = "move";

      const cursorPosition = reactFlowInstanceRef.current?.screenToFlowPosition(
        {
          x: event.clientX,
          y: event.clientY,
        },
      );

      if (cursorPosition) {
        const hoveredNode = nodes.find((node) =>
          isPositionInNode(node, cursorPosition),
        );

        if (hoveredNode?.id === replaceTarget?.id) return;

        setReplaceTarget(hoveredNode || null);
      }
    },
    [reactFlowInstanceRef, nodes, replaceTarget, setReplaceTarget],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // Handle file drops
      if (event.dataTransfer.files.length > 0) {
        handleDrop(event);
        return;
      }

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

      if (reactFlowInstanceRef.current) {
        const position = getPositionFromEvent(
          event,
          reactFlowInstanceRef.current,
        );

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
      reactFlowInstanceRef,
      replaceTarget,
      setComponentSpec,
      updateGraphSpec,
      triggerConfirmation,
      handleDrop,
    ],
  );

  const onRemoveNodes = useCallback(async () => {
    const confirmed = await triggerConfirmation(
      getDeleteConfirmationDetails({ nodes: selectedNodes, edges: [] }),
    );
    if (confirmed) {
      onElementsRemove(selectedElements);
    }
  }, [selectedElements, onElementsRemove, triggerConfirmation]);

  const handleOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const positionChanges = changes.filter(
        (change) => change.type === "position" && change.dragging === false,
      );

      if (positionChanges.length > 0) {
        const updatedNodes = positionChanges
          .map((change) => {
            if ("id" in change && "position" in change && change.position) {
              const node = nodes.find((n) => n.id === change.id);
              return node
                ? {
                    ...node,
                    position: { x: change.position.x, y: change.position.y },
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
    },
    [nodes, componentSpec, setComponentSpec, onNodesChange],
  );

  const handleBeforeDelete = async (params: NodesAndEdges) => {
    if (readOnly) {
      return false;
    }

    if (params.nodes.length === 0 && params.edges.length === 0) {
      return false;
    }

    // Skip confirmation if Shift key is pressed
    if (shiftKeyPressed) {
      return true;
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
          const center = reactFlowInstanceRef.current?.screenToFlowPosition({
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
  }, [graphSpec, nodes, reactFlowInstanceRef, store, updateOrAddNodes]);

  useCopyPaste({
    onCopy,
    onPaste,
  });

  const onPaneClick = () => {
    clearContent();
  };

  return (
    <>
      <ReactFlow
        {...rest}
        nodes={allNodes}
        edges={edges}
        minZoom={0.01}
        maxZoom={3}
        onNodesChange={handleOnNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onBeforeDelete={handleBeforeDelete}
        onDelete={onElementsRemove}
        onInit={onInit}
        deleteKeyCode={["Delete", "Backspace"]}
        onSelectionChange={handleSelectionChange}
        onSelectionEnd={handleSelectionEnd}
        nodesConnectable={readOnly ? false : nodesConnectable}
        connectOnClick={!readOnly}
        className={cn(
          (rest.selectionOnDrag || (shiftKeyPressed && !isConnecting)) &&
            "cursor-crosshair",
        )}
      >
        <NodeToolbar
          nodeId={selectedNodes.map((node) => node.id)}
          isVisible={showToolbar}
          offset={0}
          align="end"
        >
          <SelectionToolbar
            onDelete={!readOnly ? onRemoveNodes : undefined}
            onDuplicate={!readOnly ? onDuplicateNodes : undefined}
            onCopy={!readOnly ? undefined : onCopy}
            onUpgrade={!readOnly ? onUpgradeNodes : undefined}
          />
        </NodeToolbar>
        {children}
      </ReactFlow>
      <ConfirmationDialog
        {...confirmationProps}
        onConfirm={() => confirmationHandlers?.onConfirm()}
        onCancel={() => confirmationHandlers?.onCancel()}
      />
      <ComponentDuplicateDialog
        existingComponent={existingAndNewComponent?.existingComponent}
        newComponent={existingAndNewComponent?.newComponent}
        setClose={handleCancelUpload}
        handleImportComponent={handleImportComponent}
      />
    </>
  );
};

export default FlowCanvas;
