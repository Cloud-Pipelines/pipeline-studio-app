/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {useState } from "react";
import type { DragEvent } from "react";
import { MarkerType, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import type {
  Node,
  Edge,
  Connection,
  XYPosition,
  ReactFlowInstance,
  ReactFlowProps,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';

import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  InputSpec,
  OutputSpec,
  TaskOutputArgument,
  TaskSpec,
} from "../componentSpec";
import { isGraphImplementation } from "../componentSpec";
import ComponentTaskNode from "./ComponentTaskNode";
import { isComponentTaskNode } from "./ComponentTaskNode";



const NODE_LAYOUT_ANNOTATION_KEY = "editor.position";
const SDK_ANNOTATION_KEY = "sdk";
const SDK_ANNOTATION_VALUE = "https://cloud-pipelines.net/pipeline-editor/";

export const EMPTY_GRAPH_COMPONENT_SPEC: ComponentSpec = {
  implementation: {
    graph: {
      tasks: {},
    },
  },
};

const taskIdToNodeId = (id: string) => "task_" + id;
const inputNameToNodeId = (name: string) => "input_" + name;
const outputNameToNodeId = (name: string) => "output_" + name;

const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");
const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

export const augmentComponentSpec = (
  componentSpec: ComponentSpec,
  nodes: Node[],
  includeSpecs = false,
  includePositions = true
) => {
  componentSpec = { ...componentSpec };

  const getNodePositionAnnotation = (node: Node) =>
    JSON.stringify({
      // node.position cannot be used since set at 1st drop and never updated
      x: node.position.x,
      y: node.position.y,
      width: node.width,
      height: node.height,
    });

  const nodeXPositionComparer = (n1: Node, n2: Node) => {
    const deltaX = n1.position.x - n2.position.x;
    const deltaY = n1.position.y - n2.position.y;
    return deltaX !== 0 ? deltaX : deltaY;
  };
  const nodeYPositionComparer = (n1: Node, n2: Node) => {
    const deltaX = n1.position.x - n2.position.x;
    const deltaY = n1.position.y - n2.position.y;
    return deltaY !== 0 ? deltaY : deltaX;
  };

  // Input and output nodes
  // Sorting them by horizontal position to make reordering inputs and outputs easy.
  const inputNodes = nodes
    .filter((node) => node.type === "input")
    .sort(nodeXPositionComparer);
  const outputNodes = nodes
    .filter((node) => node.type === "output")
    .sort(nodeXPositionComparer);
  const taskNodes = nodes
    .filter(isComponentTaskNode)
    .sort(nodeYPositionComparer);

  const inputPositionMap = new Map<string, string>(
    inputNodes.map((node) => [
      nodeIdToInputName(node.id),
      getNodePositionAnnotation(node),
    ])
  );
  const inputOrderMap = new Map<string, number>(
    inputNodes.map((node, index) => [nodeIdToInputName(node.id), index])
  );
  const inputOrderComparer = (a: InputSpec, b: InputSpec) =>
    (inputOrderMap.get(a.name) ?? Infinity) -
    (inputOrderMap.get(b.name) ?? Infinity);
  const outputPositionMap = new Map<string, string>(
    outputNodes.map((node) => [
      nodeIdToOutputName(node.id),
      getNodePositionAnnotation(node),
    ])
  );
  const outputOrderMap = new Map<string, number>(
    outputNodes.map((node, index) => [nodeIdToOutputName(node.id), index])
  );
  const outputOrderComparer = (a: OutputSpec, b: OutputSpec) =>
    (outputOrderMap.get(a.name) ?? Infinity) -
    (outputOrderMap.get(b.name) ?? Infinity);
  const taskPositionMap = new Map<string, string>(
    taskNodes.map((node) => [
      nodeIdToTaskId(node.id),
      getNodePositionAnnotation(node),
    ])
  );
  const taskOrderMap = new Map<string, number>(
    taskNodes.map((node, index) => [nodeIdToTaskId(node.id), index])
  );
  const taskOrderComparer = (
    pairA: [string, TaskSpec],
    pairB: [string, TaskSpec]
  ) =>
    (taskOrderMap.get(pairA[0]) ?? Infinity) -
    (taskOrderMap.get(pairB[0]) ?? Infinity);

  componentSpec.inputs = componentSpec.inputs
    ?.map((inputSpec) => {
      if (!inputPositionMap.has(inputSpec.name) || !inputOrderMap.has(inputSpec.name)) {
        throw Error(`The nodes array does not have input node ${inputSpec.name}`);
      }
      let newAnnotations = { ...inputSpec.annotations };
      if (includePositions) {
        newAnnotations[NODE_LAYOUT_ANNOTATION_KEY] = inputPositionMap.get(
          inputSpec.name
        );
      } else {
        delete newAnnotations[NODE_LAYOUT_ANNOTATION_KEY];
      }
      let newInputSpec: InputSpec = {
        ...inputSpec,
        annotations: newAnnotations,
      };
      if (Object.keys(newAnnotations).length === 0) {
        delete newInputSpec.annotations;
      }
      return newInputSpec;
    })
    .sort(inputOrderComparer);

  componentSpec.outputs = componentSpec.outputs
    ?.map((outputSpec) => {
      if (!outputPositionMap.has(outputSpec.name) || !outputOrderMap.has(outputSpec.name)) {
        throw Error(`The nodes array does not have output node ${outputSpec.name}`);
      }
      let newAnnotations = { ...outputSpec.annotations };
      if (includePositions) {
        newAnnotations[NODE_LAYOUT_ANNOTATION_KEY] = outputPositionMap.get(
          outputSpec.name
        );
      } else {
        delete newAnnotations[NODE_LAYOUT_ANNOTATION_KEY];
      }
      let newOutputSpec: OutputSpec = {
        ...outputSpec,
        annotations: newAnnotations,
      };
      if (
        newAnnotations === undefined ||
        Object.keys(newAnnotations).length === 0
      ) {
        delete newOutputSpec.annotations;
      }
      return newOutputSpec;
    })
    .sort(outputOrderComparer);

  if (!isGraphImplementation(componentSpec.implementation)) {
    return componentSpec;
  }

  let graphSpec: GraphSpec = { ...componentSpec.implementation.graph };
  const newTasks = Object.fromEntries(
    Object.entries(graphSpec.tasks || {})
      .map(([taskId, taskSpec]) => {
        if (!taskPositionMap.has(taskId) || !taskOrderMap.has(taskId)) {
          throw Error(`The nodes array does not have task node ${taskId}`);
        }
        let newAnnotations = { ...taskSpec.annotations };
        if (includePositions) {
          newAnnotations[NODE_LAYOUT_ANNOTATION_KEY] =
            taskPositionMap.get(taskId);
        } else {
          delete newAnnotations[NODE_LAYOUT_ANNOTATION_KEY];
        }
        let newTaskSpec: TaskSpec = {
          ...taskSpec,
          annotations: newAnnotations,
        };
        if (
          newAnnotations === undefined ||
          Object.keys(newAnnotations).length === 0
        ) {
          delete newTaskSpec.annotations;
        }
        // TODO: Sort the arguments based on the ordering of the component inputs.
        if (
          !includeSpecs &&
          newTaskSpec.componentRef.spec !== undefined &&
          newTaskSpec.componentRef.url !== undefined
        ) {
          newTaskSpec.componentRef = { ...newTaskSpec.componentRef };
          delete newTaskSpec.componentRef.spec;
        }
        // Always deleting the text since it's not yet supported in some SDKs.
        delete newTaskSpec.componentRef.text;
        return [taskId, newTaskSpec] as [string, TaskSpec];
      })
      .sort(taskOrderComparer)
  );
  if (newTasks !== undefined) {
    graphSpec.tasks = newTasks;
  }
  componentSpec = {
    ...componentSpec,
    implementation: { ...componentSpec.implementation, graph: graphSpec },
  };

  componentSpec = {
    ...componentSpec,
    metadata: {
      ...componentSpec.metadata,
      annotations: {
        ...componentSpec.metadata?.annotations,
        [SDK_ANNOTATION_KEY]: SDK_ANNOTATION_VALUE
      }
    }
  }

  // Reordering the attributes and removing the undefined ones
  const rebuildComponentSpec = ({
    name,
    description,
    metadata,
    inputs,
    outputs,
    implementation,
    ...rest
  }: ComponentSpec): ComponentSpec => ({
    ...(name && { name: name }),
    ...(description && { description: description }),
    ...(metadata && { metadata: metadata }),
    ...(inputs && { inputs: inputs }),
    ...(outputs && { outputs: outputs }),
    implementation: implementation,
    ...rest,
  });
  componentSpec = rebuildComponentSpec(componentSpec);

  return componentSpec;
};

const makeNameUniqueByAddingIndex = (name: string, existingNames: Set<string>): string => {
  let finalName = name;
  let index = 1;
  while (existingNames.has(finalName)) {
    index++;
    finalName = name + " " + index.toString();
  }
  return finalName;
};

const getUniqueInputName = (
  componentSpec: ComponentSpec,
  name: string = "Input",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.inputs?.map((inputSpec) => inputSpec.name))
  );
};

const getUniqueOutputName = (
  componentSpec: ComponentSpec,
  name: string = "Output",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.outputs?.map((outputSpec) => outputSpec.name))
  );
};

const getUniqueTaskName = (
  graphSpec: GraphSpec,
  name: string = "Task",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(Object.keys(graphSpec.tasks))
  );
};

export interface GraphComponentSpecFlowProps
  extends Omit<ReactFlowProps, "elements"> {
  componentSpec: ComponentSpec,
  setComponentSpec: (componentSpec: ComponentSpec) => void,
}

const nodeTypes = {
  task: ComponentTaskNode,
};

const GraphComponentSpecFlow = ({
  children,
  componentSpec = { implementation: { graph: { tasks: {} } } },
  setComponentSpec,
  ...rest
}: GraphComponentSpecFlowProps) => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();

  if (! ('graph' in componentSpec.implementation)) {
    // Only graph components are supported
    return <></>;
  }
  let graphSpec = componentSpec.implementation.graph;

  const getPositionFromAnnotations = (annotations?: Record<string, unknown>): XYPosition => {
    if (!annotations) return { x: 0, y: 0 };

    try {
      const layoutAnnotation = annotations["editor.position"] as string;
      const { x, y } = JSON.parse(layoutAnnotation);
      return { x, y };
    } catch {
      return { x: 0, y: 0 };
    }
  };

  const nodes = Object.entries(graphSpec.tasks).map<Node>(([taskId, taskSpec]) => ({
    id: taskIdToNodeId(taskId), // looks like
    data: {
      taskSpec,
      taskId,
      setArguments: (args: Record<string, ArgumentType>) => setTaskArguments(taskId, args),
    },
    position: getPositionFromAnnotations(taskSpec.annotations),
    type: "task",
  }));

  const inputNodes = (componentSpec.inputs ?? []).map<Node>(
    (inputSpec) => {
      let position: XYPosition = { x: 0, y: 0 };
      if (inputSpec.annotations !== undefined) {
        try {
          const layoutAnnotation = inputSpec.annotations[
            "editor.position"
          ] as string;
          const decodedPosition = JSON.parse(layoutAnnotation);
          position = { x: decodedPosition["x"], y: decodedPosition["y"] };
        } catch (err) {}
      }
      return {
        id: inputNameToNodeId(inputSpec.name),
        data: { label: inputSpec.name },
        position: position,
        type: "input",
      };
    }
  );

  const outputNodes = (componentSpec.outputs ?? []).map<Node>(
    (outputSpec) => {
      let position: XYPosition = { x: 0, y: 0 };
      if (outputSpec.annotations !== undefined) {
        try {
          const layoutAnnotation = outputSpec.annotations[
            "editor.position"
          ] as string;
          const decodedPosition = JSON.parse(layoutAnnotation);
          position = { x: decodedPosition["x"], y: decodedPosition["y"] };
        } catch (err) {}
      }
      return {
        id: outputNameToNodeId(outputSpec.name),
        data: { label: outputSpec.name },
        position: position,
        type: "output",
      };
    }
  );

  const edges: Edge[] = Object.entries(graphSpec.tasks).flatMap(
    ([taskId, taskSpec]) => {
      return Object.entries(taskSpec.arguments ?? {}).flatMap(
        ([inputName, argument]) => {
          if (typeof argument === "string") {
            return [];
          }
          if ("taskOutput" in argument) {
            const taskOutput = argument.taskOutput;
            const edge: Edge = {
              id: `${taskOutput.taskId}_${taskOutput.outputName}-${taskId}_${inputName}`,
              source: taskIdToNodeId(taskOutput.taskId),
              sourceHandle: `output_${taskOutput.outputName}`,
              target: taskIdToNodeId(taskId),
              targetHandle: `input_${inputName}`,
              markerEnd: MarkerType.ArrowClosed,
            };
            return [edge];
          } else if ("graphInput" in argument) {
            const graphInput = argument.graphInput;
            const edge: Edge = {
              id: `Input_${graphInput.inputName}-${taskId}_${inputName}`,
              source: inputNameToNodeId(graphInput.inputName),
              //sourceHandle: undefined,
              //sourceHandle: "Input",
              sourceHandle: null,
              target: taskIdToNodeId(taskId),
              targetHandle: `input_${inputName}`,
              markerEnd: MarkerType.ArrowClosed,
            };
            return [edge];
          } else {
            console.error("Impossible task input argument kind: ", argument);
            return [];
          }
        }
      );
    }
  );

  const outputEdges: Edge[] = Object.entries(graphSpec.outputValues ?? {}).map(
    ([outputName, argument]) => {
      const taskOutput = argument.taskOutput;
      const edge: Edge = {
        id: `${taskOutput.taskId}_${taskOutput.outputName}-Output_${outputName}`,
        source: taskIdToNodeId(taskOutput.taskId),
        sourceHandle: `output_${taskOutput.outputName}`,
        target: outputNameToNodeId(outputName),
        //targetHandle: undefined,
        //targetHandle: "Output",
        targetHandle: null,
        markerEnd: MarkerType.ArrowClosed,
      };
      return edge;
    }
  );

  const replaceComponentSpec = (newComponentSpec: ComponentSpec) => {
    componentSpec = newComponentSpec;
    setComponentSpec(newComponentSpec);
  };

  const replaceGraphSpec = (newGraphSpec: GraphSpec) => {
    graphSpec = newGraphSpec;
    replaceComponentSpec({ ...componentSpec, implementation: { graph: graphSpec } });
  };

  const setTaskArguments = (
    taskId: string,
    taskArguments?: Record<string, ArgumentType>,
  ) => {
    let newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: { ...graphSpec.tasks },
    };
    newGraphSpec.tasks[taskId] = {
      ...graphSpec.tasks[taskId],
      arguments: taskArguments,
    };
    replaceGraphSpec(newGraphSpec);
  };

  const setTaskArgument = (
    taskId: string,
    inputName: string,
    argument?: ArgumentType
  ) => {
    const oldTaskSpec = graphSpec.tasks[taskId];
    const oldTaskSpecArguments = oldTaskSpec.arguments;
    let newTaskSpecArguments: Record<string, ArgumentType> = {
      ...oldTaskSpecArguments,
    };
    if (argument === undefined) {
      delete newTaskSpecArguments[inputName];
    } else {
      newTaskSpecArguments[inputName] = argument;
    }
    setTaskArguments(taskId, newTaskSpecArguments);
  };

  const removeTaskArgument = (taskId: string, inputName: string) =>
    setTaskArgument(taskId, inputName, undefined);

  const setGraphOutputValue = (
    outputName: string,
    outputValue?: TaskOutputArgument
  ) => {
    let newGraphOutputValues = { ...graphSpec.outputValues };
    if (outputValue === undefined) {
      delete newGraphOutputValues[outputName];
    } else {
      newGraphOutputValues[outputName] = outputValue;
    }
    graphSpec = { ...graphSpec, outputValues: newGraphOutputValues };
    replaceGraphSpec(graphSpec);
  };

  const removeGraphOutputValue = (outputName: string) =>
    setGraphOutputValue(outputName);

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

  const onConnect = (params: Connection | Edge) => {
    addConnection(params);
  };

  const removeEdge = (edge: Edge) => {
    const inputName = edge.targetHandle?.replace(/^input_/, "");

    if (inputName !== undefined) {
      removeTaskArgument(nodeIdToTaskId(edge.target), inputName);
    } else {
      removeGraphOutputValue(nodeIdToOutputName(edge.target));
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
            removeTaskArgument(taskId, inputName);
          }
        }
      }
    }
    // Not checking the sources of graph outputs, since they cannot be directly connected to the graph inputs

    // Removing the input itself
    const newInputs = (componentSpec.inputs ?? []).filter(
      (inputSpec) => inputSpec.name !== inputNameToRemove
    );
    componentSpec = { ...componentSpec, inputs: newInputs };
    replaceComponentSpec(componentSpec);
  };

  const removeComponentOutput = (outputNameToRemove: string) => {
    removeGraphOutputValue(outputNameToRemove);
    // Removing the output itself
    const newOutputs = (componentSpec.outputs ?? []).filter(
      (outputSpec) => outputSpec.name !== outputNameToRemove
    );
    componentSpec = { ...componentSpec, outputs: newOutputs };
    replaceComponentSpec(componentSpec);
  };

  const removeTask = (taskIdToRemove: string) => {
    // Removing the outcoming edges
    // Not really needed since react-flow sends the node's incoming and outcoming edges for deletion when a node is deleted
    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
      for (const [inputName, argument] of Object.entries(
        taskSpec.arguments ?? {}
      )) {
        if (typeof argument !== "string" && "taskOutput" in argument) {
          if (argument.taskOutput.taskId === taskIdToRemove) {
            removeTaskArgument(taskId, inputName);
          }
        }
      }
    }

    // Removing outcoming edges that go to graph outputs.
    // ? Should we delete the outputs themselves
    const newGraphOutputValues = Object.fromEntries(
      Object.entries(graphSpec.outputValues ?? {}).filter(
        ([_, argument]) => argument.taskOutput.taskId !== taskIdToRemove
      )
    );
    graphSpec = { ...graphSpec, outputValues: newGraphOutputValues };

    // Removing the task
    let newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: { ...graphSpec.tasks },
    };
    delete newGraphSpec.tasks[taskIdToRemove];
    replaceGraphSpec(newGraphSpec);
  };

  const removeNode = (node: Node) => {
    // TODO: Use global constants for node types
    if (node.type === "input") {
      const inputName = nodeIdToInputName(node.id);
      removeComponentInput(inputName);
    } else if (node.type === "output") {
      const outputName = nodeIdToOutputName(node.id);
      removeComponentOutput(outputName);
    } else if (node.type === "task") {
      const taskId = nodeIdToTaskId(node.id);
      removeTask(taskId);
    } else {
      console.log("removeNode: Unexpected note type: ", node);
    }
  };

  const onNodesDelete = (nodesToDelete: Node[]) => {
    nodesToDelete.forEach(node => removeNode(node));
  };

  const onEdgesDelete = (edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => removeEdge(edge));
  };

  const onLoad = (_reactFlowInstance: ReactFlowInstance) =>
    setReactFlowInstance(_reactFlowInstance);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    if (reactFlowInstance) {
      const droppedData = event.dataTransfer.getData("application/reactflow");
      if (droppedData === "") {
        return;
      }
      const droppedDataObject = JSON.parse(droppedData);
      const nodeType = Object.keys(droppedDataObject)[0];
      const nodeData = droppedDataObject[nodeType];

      // Correcting the position using the drag point location information
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      const dragStartOffsetData = event.dataTransfer.getData("DragStart.offset");
      if (dragStartOffsetData !== "") {
        const dragStartOffset = JSON.parse(dragStartOffsetData);
        dragOffsetX = dragStartOffset.offsetX ?? 0;
        dragOffsetY = dragStartOffset.offsetY ?? 0;
      }

      // Node position. Offsets should be included in projection, so that they snap to the grid.
      // Otherwise the dropped nodes will be out of phase with the rest of the nodes even when snapping.
      let position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - dragOffsetX,
        y: event.clientY - dragOffsetY,
      });

      const nodePosition = { x: position.x, y: position.y };
      const positionAnnotations = {
        "editor.position": JSON.stringify(nodePosition),
      }
      if (nodeType === "task") {
        const taskSpec = nodeData as TaskSpec;
        const mergedAnnotations = {
          ...taskSpec.annotations,
          ...positionAnnotations,
        };
        taskSpec.annotations = mergedAnnotations;
        const taskSpecWithAnnotation: TaskSpec = {
          ...taskSpec,
          annotations: mergedAnnotations,
        };
        const taskId = getUniqueTaskName(
          graphSpec,
          taskSpec.componentRef.spec?.name ?? "Task"
        );
        graphSpec = { ...graphSpec, tasks: { ...graphSpec.tasks } };
        graphSpec.tasks[taskId] = taskSpecWithAnnotation;
        replaceGraphSpec(graphSpec);
      } else if (nodeType === "input") {
        const inputId = getUniqueInputName(componentSpec);
        const inputSpec: InputSpec = {
          name: inputId,
          annotations: positionAnnotations,
        };
        const inputs = (componentSpec.inputs ?? []).concat([inputSpec]);
        componentSpec = { ...componentSpec, inputs: inputs };
        replaceComponentSpec(componentSpec);
      } else if (nodeType === "output") {
        const outputId = getUniqueOutputName(componentSpec);
        const outputSpec: OutputSpec = {
          name: outputId,
          annotations: positionAnnotations,
        };
        const outputs = (componentSpec.outputs ?? []).concat([outputSpec]);
        componentSpec = { ...componentSpec, outputs: outputs };
        replaceComponentSpec(componentSpec);
      }
    }
  };

  console.log("nodes", nodes);
  console.log("inputNodes", inputNodes);
  console.log("outputNodes", outputNodes);
  console.log("edges", edges);
  console.log("outputEdges", outputEdges);

  return <TestFlowComp />
  return (
    <ReactFlowProvider>
      <ReactFlow
        {...rest}
        nodes={[...nodes, ...inputNodes, ...outputNodes]}
        edges={[...edges, ...outputEdges]}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onInit={onLoad}
        deleteKeyCode={
          rest.deleteKeyCode ?? (isAppleOS() ? "Backspace" : "Delete")
        }
        multiSelectionKeyCode={
          rest.multiSelectionKeyCode ?? (isAppleOS() ? "Command" : "Control")
        }
      >
        {children}
      </ReactFlow>
    </ReactFlowProvider>
  );
};

export default GraphComponentSpecFlow;

const isAppleOS = () =>
  window.navigator.platform.startsWith("Mac") ||
  window.navigator.platform.startsWith("iPhone") ||
  window.navigator.platform.startsWith("iPad") ||
  window.navigator.platform.startsWith("iPod");
