/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import type {
  Edge,
  Node,
  NodeChange,
  ReactFlowInstance,
  ReactFlowProps,
} from "@xyflow/react";
import { type OnInit, ReactFlow } from "@xyflow/react";
import type { DragEvent } from "react";
import { useState } from "react";

import type {
  ArgumentType,
  ComponentSpec,
  TaskOutputArgument,
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
};

const GraphComponentSpecFlow = ({
  children,
  componentSpec = EMPTY_GRAPH_COMPONENT_SPEC,
  setComponentSpec,
  ...rest
}: GraphComponentSpecFlowProps) => {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>();
  const { nodes, onNodesChange } = useComponentSpecToNodes(
    componentSpec,
    setComponentSpec,
  );
  const { edges, onEdgesChange } = useComponentSpecToEdges(componentSpec);

  if (!("graph" in componentSpec.implementation)) {
    return null;
  }
  const graphSpec = componentSpec.implementation.graph;

  const setTaskArgument = (
    taskId: string,
    inputName: string,
    argument?: ArgumentType,
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
      newTaskSpecArguments,
    );

    setComponentSpec({
      ...componentSpec,
      implementation: { graph: newGraphSpec },
    });
  };
  const setGraphOutputValue = (
    outputName: string,
    outputValue?: TaskOutputArgument,
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
        taskSpec.arguments ?? {},
      )) {
        if (typeof argument !== "string" && "graphInput" in argument) {
          if (argument.graphInput.inputName === inputNameToRemove) {
            setTaskArgument(taskId, inputName);
          }
        }
      }
    }

    const newInputs = (componentSpec.inputs ?? []).filter(
      (inputSpec) => inputSpec.name !== inputNameToRemove,
    );
    setComponentSpec({ ...componentSpec, inputs: newInputs });
  };

  const removeComponentOutput = (outputNameToRemove: string) => {
    setGraphOutputValue(outputNameToRemove);
    // Removing the output itself
    const newOutputs = (componentSpec.outputs ?? []).filter(
      (outputSpec) => outputSpec.name !== outputNameToRemove,
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
        ([_, argument]) => argument.taskOutput.taskId !== taskIdToRemove,
      ),
    );

    // Step 3: Remove the task itself from the graph
    const newTasks = Object.fromEntries(
      Object.entries(graphSpec.tasks).filter(
        ([taskId]) => taskId !== taskIdToRemove,
      ),
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
        graphSpec,
      );
    }
  };

  const onElementsRemove = (params: { nodes: Node[]; edges: Edge[] }) => {
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
  };

  const handleOnNodesChange = (changes: NodeChange[]) => {
    // Process position changes and update component spec
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
        updateNodePositions(updatedNodes, componentSpec, setComponentSpec);
      }
    }

    onNodesChange(changes);
  };

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
