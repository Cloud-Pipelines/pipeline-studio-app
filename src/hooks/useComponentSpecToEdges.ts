import {
  type Edge,
  type EdgeChange,
  MarkerType,
  useEdgesState,
} from "@xyflow/react";
import { useEffect } from "react";

import { NodeManager } from "@/nodeManager";
import {
  type ArgumentType,
  type ComponentSpec,
  type GraphInputArgument,
  type GraphSpec,
  isGraphImplementation,
  type TaskOutputArgument,
  type TaskSpec,
} from "@/utils/componentSpec";
import {
  inputNameToInputId,
  outputNameToOutputId,
} from "@/utils/nodes/conversions";

import { useNodeManager } from "./useNodeManager";

const useComponentSpecToEdges = (
  componentSpec: ComponentSpec,
): {
  edges: Edge<any>[];
  onEdgesChange: (changes: EdgeChange[]) => void;
} => {
  const { nodeManager } = useNodeManager();
  const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(
    getEdges(componentSpec, nodeManager),
  );

  useEffect(() => {
    const newEdges = getEdges(componentSpec, nodeManager);
    setFlowEdges(newEdges);
  }, [componentSpec, nodeManager]);

  return {
    edges: flowEdges,
    onEdgesChange: onFlowEdgesChange,
  };
};

const getEdges = (componentSpec: ComponentSpec, nodeManager: NodeManager) => {
  if (!isGraphImplementation(componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskEdges = createEdgesFromTaskSpec(graphSpec, nodeManager);
  const outputEdges = createOutputEdgesFromGraphSpec(graphSpec, nodeManager);
  return [...taskEdges, ...outputEdges];
};

const createEdgesFromTaskSpec = (
  graphSpec: GraphSpec,
  nodeManager: NodeManager,
) => {
  const edges: Edge[] = Object.entries(graphSpec.tasks).flatMap(
    ([taskId, taskSpec]) => createEdgesForTask(taskId, taskSpec, nodeManager),
  );
  return edges;
};

const createEdgesForTask = (
  taskId: string,
  taskSpec: TaskSpec,
  nodeManager: NodeManager,
): Edge[] => {
  return Object.entries(taskSpec.arguments ?? {}).flatMap(
    ([inputName, argument]) =>
      createEdgeForArgument(taskId, inputName, argument, nodeManager),
  );
};

const createEdgeForArgument = (
  taskId: string,
  inputName: string,
  argument: ArgumentType,
  nodeManager: NodeManager,
): Edge[] => {
  if (typeof argument === "string") {
    return [];
  }

  if ("taskOutput" in argument) {
    return [
      createTaskOutputEdge(taskId, inputName, argument.taskOutput, nodeManager),
    ];
  }

  if ("graphInput" in argument) {
    return [
      createGraphInputEdge(taskId, inputName, argument.graphInput, nodeManager),
    ];
  }

  console.error("Impossible task input argument kind: ", argument);
  return [];
};

const createTaskOutputEdge = (
  taskId: string,
  inputName: string,
  taskOutput: TaskOutputArgument["taskOutput"],
  nodeManager: NodeManager,
): Edge => {
  const sourceNodeId = nodeManager.getNodeId(taskOutput.taskId, "task");
  const targetNodeId = nodeManager.getNodeId(taskId, "task");

  const sourceHandleNodeId = nodeManager.getTaskHandleNodeId(
    taskOutput.taskId,
    taskOutput.outputName,
    "taskOutput",
  );

  const targetHandleNodeId = nodeManager.getTaskHandleNodeId(
    taskId,
    inputName,
    "taskInput",
  );

  return {
    id: `${taskOutput.taskId}_${taskOutput.outputName}-${taskId}_${inputName}`,
    source: sourceNodeId,
    sourceHandle: sourceHandleNodeId,
    target: targetNodeId,
    targetHandle: targetHandleNodeId,
    markerEnd: { type: MarkerType.Arrow },
    type: "customEdge",
  };
};

const createGraphInputEdge = (
  taskId: string,
  inputName: string,
  graphInput: GraphInputArgument["graphInput"],
  nodeManager: NodeManager,
): Edge => {
  const inputId = inputNameToInputId(graphInput.inputName);
  const sourceNodeId = nodeManager.getNodeId(inputId, "input");
  const targetNodeId = nodeManager.getNodeId(taskId, "task");

  const targetHandleNodeId = nodeManager.getTaskHandleNodeId(
    taskId,
    inputName,
    "taskInput",
  );

  return {
    id: `Input_${inputId}-${taskId}_${inputName}`,
    source: sourceNodeId,
    sourceHandle: null,
    target: targetNodeId,
    targetHandle: targetHandleNodeId,
    type: "customEdge",
    markerEnd: { type: MarkerType.Arrow },
  };
};

const createOutputEdgesFromGraphSpec = (
  graphSpec: GraphSpec,
  nodeManager: NodeManager,
) => {
  const outputEdges: Edge[] = Object.entries(graphSpec.outputValues ?? {}).map(
    ([outputName, argument]) => {
      const taskOutput = argument.taskOutput;

      const sourceNodeId = nodeManager.getNodeId(taskOutput.taskId, "task");
      const targetOutputId = outputNameToOutputId(outputName);
      const targetNodeId = nodeManager.getNodeId(targetOutputId, "output");

      const sourceHandleNodeId = nodeManager.getTaskHandleNodeId(
        taskOutput.taskId,
        taskOutput.outputName,
        "taskOutput",
      );

      const edge: Edge = {
        id: `${taskOutput.taskId}_${taskOutput.outputName}-Output_${outputName}`,
        source: sourceNodeId,
        sourceHandle: sourceHandleNodeId,
        target: targetNodeId,
        targetHandle: null,
        type: "customEdge",
        markerEnd: { type: MarkerType.Arrow },
      };
      return edge;
    },
  );
  return outputEdges;
};

export default useComponentSpecToEdges;
