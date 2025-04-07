/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  type Edge,
  type Node,
  type NodeChange,
  type OnInit,
  ReactFlow,
  type ReactFlowInstance,
  type ReactFlowProps,
  type XYPosition,
} from "@xyflow/react";
import {
  type DragEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useSelectionToolbar } from "@/hooks/useSelectionToolbar";
import { generateUniqueDuplicateStringId } from "@/utils/generateUniqueDuplicateStringId";

import {
  type ArgumentType,
  type ComponentSpec,
  type GraphImplementation,
  type TaskOutputArgument,
  type TaskSpec,
} from "../componentSpec";
import useComponentSpecToEdges from "../hooks/useComponentSpecToEdges";
import useComponentSpecToNodes from "../hooks/useComponentSpecToNodes";
import { useConnectionHandler } from "../hooks/useConnectionHandler";
import {
  nodeIdToInputName,
  nodeIdToOutputName,
  nodeIdToTaskId,
} from "../utils/nodeIdUtils";
import onDropNode from "../utils/onDropNode";
import replaceTaskArgumentsInGraphSpec from "../utils/replaceTaskArgumentsInGraphSpec";
import { updateNodePositions } from "../utils/updateNodePosition";
import ComponentTaskNode from "./ComponentTaskNode";
import SelectionToolbar from "./SelectionToolbar";

export const EMPTY_GRAPH_COMPONENT_SPEC: ComponentSpec = {
  implementation: {
    graph: {
      tasks: {},
    },
  },
};

export interface GraphComponentSpecFlowProps
  extends Omit<ReactFlowProps, "elements"> {
  componentSpec: ComponentSpec;
  setComponentSpec: (componentSpec: ComponentSpec) => void;
}

const nodeTypes: Record<string, React.ComponentType<any>> = {
  task: ComponentTaskNode,
  toolbar: SelectionToolbar,
};

const GraphComponentSpecFlow = ({
  children,
  componentSpec = EMPTY_GRAPH_COMPONENT_SPEC,
  setComponentSpec,
  ...rest
}: GraphComponentSpecFlowProps) => {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();

  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  const { nodes, onNodesChange } = useComponentSpecToNodes(
    componentSpec,
    setComponentSpec
  );
  const { edges, onEdgesChange } = useComponentSpecToEdges(componentSpec);

  const implementation = componentSpec.implementation as GraphImplementation;
  const graphSpec = implementation.graph;

  const setTaskArgument = (
    taskId: string,
    inputName: string,
    argument?: ArgumentType
  ) => {
    const oldTaskSpec = graphSpec.tasks[taskId];
    const oldTaskSpecArguments = oldTaskSpec.arguments || {};

    const nonNullArgumentObject = argument ? { [inputName]: argument } : {};
    const newTaskSpecArguments = {
      ...oldTaskSpecArguments,
      ...nonNullArgumentObject,
    };

    const newGraphSpec = replaceTaskArgumentsInGraphSpec(
      taskId,
      graphSpec,
      newTaskSpecArguments
    );

    setComponentSpec({
      ...componentSpec,
      implementation: { graph: newGraphSpec },
    });
  };

  const setGraphOutputValue = (
    outputName: string,
    outputValue?: TaskOutputArgument
  ) => {
    const nonNullOutputObject = outputValue
      ? { [outputName]: outputValue }
      : {};
    const newGraphOutputValues = {
      ...graphSpec.outputValues,
      ...nonNullOutputObject,
    };
    const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };
    setComponentSpec({
      ...componentSpec,
      implementation: { graph: newGraphSpec },
    });
  };

  const addConnection = useConnectionHandler({
    setTaskArgument,
    setGraphOutputValue,
  });

  const removeEdge = (edge: Edge) => {
    const inputName = edge.targetHandle?.replace(/^input_/, "");

    if (inputName !== undefined) {
      setTaskArgument(nodeIdToTaskId(edge.target), inputName);
    } else {
      setGraphOutputValue(nodeIdToOutputName(edge.target));
    }
  };

  const removeComponentInput = (inputNameToRemove: string) => {
    // Removing the outcoming edges
    // Not really needed since react-flow sends the node's incoming and outcoming edges for deletion when a node is deleted
    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
      for (const [inputName, argument] of Object.entries(
        taskSpec.arguments ?? {}
      )) {
        if (typeof argument !== "string" && "graphInput" in argument) {
          if (argument.graphInput.inputName === inputNameToRemove) {
            setTaskArgument(taskId, inputName);
          }
        }
      }
    }

    const newInputs = (componentSpec.inputs ?? []).filter(
      (inputSpec) => inputSpec.name !== inputNameToRemove
    );
    setComponentSpec({ ...componentSpec, inputs: newInputs });
  };

  const removeComponentOutput = (outputNameToRemove: string) => {
    setGraphOutputValue(outputNameToRemove);
    // Removing the output itself
    const newOutputs = (componentSpec.outputs ?? []).filter(
      (outputSpec) => outputSpec.name !== outputNameToRemove
    );
    setComponentSpec({ ...componentSpec, outputs: newOutputs });
  };

  const removeTask = (taskIdToRemove: string) => {
    // Step 1: Remove any connections where this task is used as a source
    // (i.e., other tasks that depend on this task's outputs)
    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
      if (!taskSpec.arguments) continue;

      for (const [inputName, argument] of Object.entries(taskSpec.arguments)) {
        // Check if this argument references the task we're removing
        const isReferencingRemovedTask =
          typeof argument !== "string" &&
          "taskOutput" in argument &&
          argument.taskOutput.taskId === taskIdToRemove;

        if (isReferencingRemovedTask) {
          setTaskArgument(taskId, inputName);
        }
      }
    }

    // Step 2: Remove any connections from this task to graph outputs
    const newGraphOutputValues = Object.fromEntries(
      Object.entries(graphSpec.outputValues ?? {}).filter(
        ([_, argument]) => argument.taskOutput.taskId !== taskIdToRemove
      )
    );

    // Step 3: Remove the task itself from the graph
    const newTasks = Object.fromEntries(
      Object.entries(graphSpec.tasks).filter(
        ([taskId]) => taskId !== taskIdToRemove
      )
    );

    // Step 4: Update the graph spec with our changes
    graphSpec.tasks = newTasks;
    graphSpec.outputValues = newGraphOutputValues;
  };

  const removeNode = (node: Node) => {
    if (node.type === "task") {
      const taskId = nodeIdToTaskId(node.id);
      removeTask(taskId);
    }

    if (node.type === "input") {
      const inputName = nodeIdToInputName(node.id);
      removeComponentInput(inputName);
    }

    if (node.type === "output") {
      const outputName = nodeIdToOutputName(node.id);
      removeComponentOutput(outputName);
    }
  };

  const onInit: OnInit = (instance) => {
    setReactFlowInstance(instance);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (reactFlowInstance) {
      onDropNode(
        event,
        reactFlowInstance,
        componentSpec,
        setComponentSpec,
        graphSpec
      );
    }
  };

  const onElementsRemove = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      for (const edge of params.edges) {
        removeEdge(edge);
      }
      for (const node of params.nodes) {
        removeNode(node);
      }

      // Save the updated graph spec to the component spec
      setComponentSpec({
        ...componentSpec,
        implementation: { graph: graphSpec },
      });
    },
    [graphSpec, componentSpec, setComponentSpec]
  );

  const removeNodes = useCallback(
    (nodes: Node[]) => {
      onElementsRemove({ nodes, edges: [] });
    },
    [onElementsRemove]
  );

  const handleOnNodesChange = (changes: NodeChange[]) => {
    // Process position changes and update component spec
    const positionChanges = changes.filter(
      (change) => change.type === "position" && change.dragging === false
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
        updateNodePositions(updatedNodes, componentSpec, setComponentSpec);
      }
    }

    onNodesChange(changes);
  };

  // todo: move core logic into the hook
  const duplicateNodes = useCallback(
    (nodesToDuplicate: Node[]) => {
      const offset = 10;
      const DEFAULT_SELECTED = true;

      const newNodes: Node[] = [];
      const newTasks: Record<string, TaskSpec> = {};
      const taskIdMap: Record<string, string> = {};

      const existingNodeIds = nodes.map((node) => node.id);

      const implementation =
        componentSpec.implementation as GraphImplementation;
      const graphSpec = implementation.graph;

      // Create new nodes and map old task IDs to new task IDs
      nodesToDuplicate.forEach((node) => {
        const newNodeId = generateUniqueDuplicateStringId(
          node.id,
          existingNodeIds
        );

        existingNodeIds.push(newNodeId);

        const newNode = {
          ...node,
          id: newNodeId,
          position: {
            x: node.position.x + offset,
            y: node.position.y + offset,
          },
          data: { ...node.data },
          selected: DEFAULT_SELECTED,
        };

        newNodes.push(newNode);

        if (node.type === "task") {
          const oldTaskId = nodeIdToTaskId(node.id);
          const newTaskId = nodeIdToTaskId(newNodeId);

          taskIdMap[oldTaskId] = newTaskId;

          const taskSpec = graphSpec.tasks[oldTaskId];
          const annotations = taskSpec.annotations || {};

          const updatedAnnotations = setPositionInAnnotations(annotations, {
            x: node.position.x + offset,
            y: node.position.y + offset,
          });

          updatedAnnotations.selected = DEFAULT_SELECTED; // new nodes are selected by default

          const newTaskSpec = {
            ...taskSpec,
            annotations: updatedAnnotations,
          };
          newTasks[newTaskId] = newTaskSpec;
        }
      });

      // Update arguments to point to correct duplicated node in the new taskspec
      Object.entries(newTasks).forEach((tasks) => {
        const [taskId, taskSpec] = tasks;

        if (taskSpec.arguments) {
          Object.entries(taskSpec.arguments).forEach(([argKey, argument]) => {
            if (typeof argument !== "string" && "taskOutput" in argument) {
              const oldTaskId = argument.taskOutput.taskId;

              // Only update the argument if the old task ID is part of the nodes being duplicated
              if (
                nodesToDuplicate.some(
                  (node) => nodeIdToTaskId(node.id) === oldTaskId
                )
              ) {
                const newTaskId = taskIdMap[oldTaskId];

                if (newTaskId && taskSpec.arguments) {
                  // Update the taskSpec in the newTasks object
                  const updatedTaskSpec = {
                    ...(newTasks[taskId] || taskSpec),
                    arguments: {
                      ...(newTasks[taskId]?.arguments || taskSpec.arguments),
                      [argKey]: {
                        ...argument,
                        taskOutput: {
                          ...argument.taskOutput,
                          taskId: newTaskId,
                        },
                      },
                    },
                  };
                  newTasks[taskId] = updatedTaskSpec;
                }
              }
            }
          });
        }
      });

      // Deselect the original tasks
      Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
        const annotations = taskSpec.annotations || {};
        annotations.selected = false;
        newTasks[taskId] = {
          ...taskSpec,
          annotations,
        };
      });

      // Update the spec (which will trigger a new render in ReactFlow)
      const updatedTasks = { ...graphSpec.tasks, ...newTasks };
      const updatedGraphSpec = { ...graphSpec, tasks: updatedTasks };

      setComponentSpec({
        ...componentSpec,
        implementation: { graph: updatedGraphSpec },
      });
    },
    [componentSpec, setComponentSpec]
  );

  const { isToolbarVisible, showToolbar, hideToolbar, updateToolbarPosition } =
    useSelectionToolbar({
      reactFlowInstance,
      selectedNodes,
      onDeleteNodes: removeNodes,
      onDuplicateNodes: duplicateNodes,
    });

  const handleSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      const nodes = params.nodes;

      setSelectedNodes(nodes);

      if (nodes.length < 1) {
        hideToolbar();
      }
    },
    [hideToolbar, reactFlowInstance]
  );

  const handleSelectionEnd = useCallback(() => {
    if (selectedNodes.length > 0) {
      showToolbar();
    } else {
      hideToolbar();
    }
  }, [selectedNodes, showToolbar, hideToolbar]);

  const handleSelectionDrag = useCallback(
    (_e: MouseEvent, nodes: Node[]) => {
      if (!isToolbarVisible) return;

      // If the toolbar is visible update its position so it stays attached to the selection box
      updateToolbarPosition(nodes);
    },
    [isToolbarVisible, updateToolbarPosition]
  );

  const handleSelectionDragEnd = useCallback(
    (_e: MouseEvent, nodes: Node[]) => {
      setSelectedNodes(nodes);
    },
    []
  );

  useEffect(() => {
    // Sync ReactFlow "selection" changes with the componentSpec so we can correctly auto-select new duplicated tasks
    if (!graphSpec) return;

    const updatedTasks = { ...graphSpec.tasks };

    Object.entries(updatedTasks).forEach(([taskId, taskSpec]) => {
      const annotations = taskSpec.annotations || {};
      annotations.selected = selectedNodes.some(
        (node) => nodeIdToTaskId(node.id) === taskId
      );
      updatedTasks[taskId] = {
        ...taskSpec,
        annotations,
      };
    });

    const updatedGraphSpec = { ...graphSpec, tasks: updatedTasks };

    if (JSON.stringify(updatedGraphSpec) === JSON.stringify(graphSpec)) {
      return;
    }

    setComponentSpec({
      ...componentSpec,
      implementation: { graph: updatedGraphSpec },
    });
  }, [selectedNodes, graphSpec, componentSpec, setComponentSpec]);

  if (!("graph" in componentSpec.implementation)) {
    return null;
  }

  return (
    <ReactFlow
      {...rest}
      nodes={nodes}
      edges={edges}
      onNodesChange={handleOnNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onConnect={addConnection}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDelete={onElementsRemove}
      onInit={onInit}
      deleteKeyCode={
        rest.deleteKeyCode ?? (isAppleOS() ? "Backspace" : "Delete")
      }
      multiSelectionKeyCode={
        rest.multiSelectionKeyCode ?? (isAppleOS() ? "Command" : "Control")
      }
      onSelectionChange={handleSelectionChange}
      onSelectionEnd={handleSelectionEnd}
      onSelectionDrag={handleSelectionDrag}
      onSelectionDragStop={handleSelectionDragEnd}
    >
      {children}
    </ReactFlow>
  );
};

export default GraphComponentSpecFlow;

const isAppleOS = () =>
  window.navigator.platform.startsWith("Mac") ||
  window.navigator.platform.startsWith("iPhone") ||
  window.navigator.platform.startsWith("iPad") ||
  window.navigator.platform.startsWith("iPod");

// todo: copied over from useComponentSpecToNode - can be moved to a shared location
const setPositionInAnnotations = (
  annotations: Record<string, unknown>,
  position: XYPosition
): Record<string, unknown> => {
  const updatedAnnotations = { ...annotations };
  updatedAnnotations["editor.position"] = JSON.stringify(position);
  return updatedAnnotations;
};
