/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";
import type { DragEvent } from "react";

import { ReactFlow, useNodesState, useEdgesState, type OnInit } from '@xyflow/react';

import type {
  ReactFlowInstance,
  Connection,
  Edge,
  Node,
  ReactFlowProps,
  NodeChange,
} from "@xyflow/react";

import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
} from "../componentSpec";

import ComponentTaskNode from "./ComponentTaskNode";
import useComponentSpecToNodes from "../hooks/useComponentSpecToNodes";
import useComponentSpecToEdges from "../hooks/useComponentSpecToEdges";
import onDropNode from "../utils/onDropNode";

export const EMPTY_GRAPH_COMPONENT_SPEC: ComponentSpec = {
  implementation: {
    graph: {
      tasks: {},
    },
  },
};

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

export interface GraphComponentSpecFlowProps
  extends Omit<ReactFlowProps, "elements"> {
  componentSpec: ComponentSpec,
  setComponentSpec: (componentSpec: ComponentSpec) => void,
}

const nodeTypes: Record<string, React.ComponentType<any>> = {
  task: ComponentTaskNode,
};

const GraphComponentSpecFlow = ({
  children,
  componentSpec = { implementation: { graph: { tasks: {} } } },
  setComponentSpec,
  ...rest
}: GraphComponentSpecFlowProps) => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const nodes = useComponentSpecToNodes(componentSpec, setComponentSpec);
  const edges = useComponentSpecToEdges(componentSpec);
  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setFlowNodes(nodes);
  }, [componentSpec]);

  useEffect(() => {
    setFlowEdges(edges);
  }, [componentSpec]);


  if (!('graph' in componentSpec.implementation)) {
    return <></>;
  }
  const graphSpec = componentSpec.implementation.graph;

  const setTaskArguments = (
    taskId: string,
    taskArguments?: Record<string, ArgumentType>,
  ) => {
    const newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: {
        ...graphSpec.tasks,
        [taskId]: {
          ...graphSpec.tasks[taskId],
          arguments: taskArguments,
        }
      }
    };

    setComponentSpec({ ...componentSpec, implementation: { graph: newGraphSpec } });
  };

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

    setTaskArguments(taskId, newTaskSpecArguments);
  };
  const setGraphOutputValue = (
    outputName: string,
    outputValue?: TaskOutputArgument
  ) => {
    const nonNullOutputObject = outputValue ? { [outputName]: outputValue } : {};
    const newGraphOutputValues = {
      ...graphSpec.outputValues,
      ...nonNullOutputObject,
    };
    const newGraphSpec = { ...graphSpec, outputValues: newGraphOutputValues };
    setComponentSpec({ ...componentSpec, implementation: { graph: newGraphSpec } });
  };

  const addConnection = (connection: Connection | Edge) => {
    if (connection.source === null || connection.target === null) {
      console.error(
        "addConnection called with missing source or target: ",
        connection
      );
      return;
    }

    const targetTaskInputName = connection.targetHandle?.replace(/^input_/, "");
    const sourceTaskOutputName = connection.sourceHandle?.replace(/^output_/, "");

    if (sourceTaskOutputName !== undefined) {
      // Source is task output
      const taskOutputArgument: TaskOutputArgument = {
        taskOutput: {
          taskId: nodeIdToTaskId(connection.source),
          outputName: sourceTaskOutputName,
        },
      };

      if (targetTaskInputName !== undefined) {
        // Target is task input
        setTaskArgument(
          nodeIdToTaskId(connection.target),
          targetTaskInputName,
          taskOutputArgument
        );
      } else {
        // Target is graph output
        setGraphOutputValue(
          nodeIdToOutputName(connection.target),
          taskOutputArgument
        );
        // TODO: Perhaps propagate type information
      }
    } else {
      // Source is graph input
      const graphInputName = nodeIdToInputName(connection.source);
      const graphInputArgument: GraphInputArgument = {
        graphInput: {
          inputName: graphInputName,
        },
      };
      if (targetTaskInputName !== undefined) {
        // Target is task input
        setTaskArgument(
          nodeIdToTaskId(connection.target),
          targetTaskInputName,
          graphInputArgument
        );
        // TODO: Perhaps propagate type information
      } else {
        // Target is graph output
        console.error(
          "addConnection: Cannot directly connect graph input to graph output: ",
          connection
        );
      }
    }
  };

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

    // Step 4: Update the component spec with our changes
    const newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: newTasks,
      outputValues: newGraphOutputValues,
    };

    setComponentSpec({ ...componentSpec, implementation: { graph: newGraphSpec } });
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

  const onLoad = (reactFlowInstance: ReactFlowInstance) =>
    setReactFlowInstance(reactFlowInstance);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (reactFlowInstance) {
      onDropNode(event, reactFlowInstance, componentSpec, setComponentSpec, graphSpec);
    }
  };

  const onElementsRemove = (params: { nodes: Node[]; edges: Edge[] }) => {
    for (const edge of params.edges) {
      removeEdge(edge);
    }
    for (const node of params.nodes) {
      removeNode(node);
    }
  };

  const updateNodePositions = (updatedNodes: Node[]) => {
    const newComponentSpec = { ...componentSpec };

    for (const node of updatedNodes) {
      const positionAnnotation = JSON.stringify({ x: node.position.x, y: node.position.y });

      if (node.type === 'task') {
        const taskId = nodeIdToTaskId(node.id);
        if (graphSpec.tasks[taskId]) {
          const taskSpec = { ...graphSpec.tasks[taskId] };
          taskSpec.annotations = {
            ...taskSpec.annotations,
            "editor.position": positionAnnotation
          };

          const newGraphSpec = {
            ...graphSpec,
            tasks: {
              ...graphSpec.tasks,
              [taskId]: taskSpec
            }
          };

          newComponentSpec.implementation = { graph: newGraphSpec };
        }
      } else if (node.type === 'input') {
        const inputName = nodeIdToInputName(node.id);
        const inputs = [...(componentSpec.inputs || [])];
        const inputIndex = inputs.findIndex(input => input.name === inputName);

        if (inputIndex >= 0) {
          inputs[inputIndex] = {
            ...inputs[inputIndex],
            annotations: {
              ...inputs[inputIndex].annotations,
              "editor.position": positionAnnotation
            }
          };
          newComponentSpec.inputs = inputs;
        }
      } else if (node.type === 'output') {
        const outputName = nodeIdToOutputName(node.id);
        const outputs = [...(componentSpec.outputs || [])];
        const outputIndex = outputs.findIndex(output => output.name === outputName);

        if (outputIndex >= 0) {
          outputs[outputIndex] = {
            ...outputs[outputIndex],
            annotations: {
              ...outputs[outputIndex].annotations,
              "editor.position": positionAnnotation
            }
          };
          newComponentSpec.outputs = outputs;
        }
      }
    }

    setComponentSpec(newComponentSpec);
  };

  const handleOnNodesChange = (changes: NodeChange[]) => {
    // Process position changes and update component spec
    const positionChanges = changes.filter(change =>
      change.type === 'position' && change.dragging === false
    );

    if (positionChanges.length > 0) {
      const updatedNodes = positionChanges.map(change => {
        if ('id' in change && 'position' in change) {
          const node = nodes.find(n => n.id === change.id);
          return node ? { ...node, position: { x: change?.position?.x, y: change?.position?.y } } : null;
        }
        return null;
      }).filter(Boolean) as Node[];


      if (updatedNodes.length > 0) {
        updateNodePositions(updatedNodes);
      }
    }

    onFlowNodesChange(changes);
  }

  return (
    <ReactFlow
      {...rest}
      nodes={flowNodes}
      edges={flowEdges}
      onNodesChange={handleOnNodesChange}
      onEdgesChange={onFlowEdgesChange}
      nodeTypes={nodeTypes}
      onConnect={addConnection}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDelete={onElementsRemove}
      onInit={onLoad as unknown as OnInit<Node, Edge>}
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
