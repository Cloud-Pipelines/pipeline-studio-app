import {
  MarkerType,
  type Edge,
} from "@xyflow/react";

import type { ComponentSpec, GraphSpec } from "../componentSpec";


const useComponentSpecToEdges = (
  componentSpec: ComponentSpec,
):  Edge<any>[] => {

  if (!('graph' in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskEdges = getTaskEdges(graphSpec);
  const outputEdges = getOutputEdges(graphSpec);
  return [...taskEdges, ...outputEdges];
}

const getTaskEdges = (graphSpec: GraphSpec) => {
  const edges: Edge[] = Object.entries(graphSpec.tasks).flatMap(
    ([taskId, taskSpec]) => createEdgesForTask(taskId, taskSpec)
  );
  return edges;
}

const createEdgesForTask = (taskId: string, taskSpec: any): Edge[] => {
  return Object.entries(taskSpec.arguments ?? {}).flatMap(
    ([inputName, argument]) => createEdgeForArgument(taskId, inputName, argument)
  );
}

const createEdgeForArgument = (taskId: string, inputName: string, argument: any): Edge[] => {
  if (typeof argument === "string") {
    return [];
  }

  if ("taskOutput" in argument) {
    return [createTaskOutputEdge(taskId, inputName, argument.taskOutput)];
  }

  if ("graphInput" in argument) {
    return [createGraphInputEdge(taskId, inputName, argument.graphInput)];
  }

  console.error("Impossible task input argument kind: ", argument);
  return [];
}

const createTaskOutputEdge = (taskId: string, inputName: string, taskOutput: any): Edge => {
  return {
    id: `${taskOutput.taskId}_${taskOutput.outputName}-${taskId}_${inputName}`,
    source: `task_${taskOutput.taskId}`,
    sourceHandle: `output_${taskOutput.outputName}`,
    target: `task_${taskId}`,
    targetHandle: `input_${inputName}`,
    markerEnd: { type: MarkerType.Arrow },
  };
}

const createGraphInputEdge = (taskId: string, inputName: string, graphInput: any): Edge => {
  return {
    id: `Input_${graphInput.inputName}-${taskId}_${inputName}`,
    source: `input_${graphInput.inputName}`,
    sourceHandle: null,
    target: `task_${taskId}`,
    targetHandle: `input_${inputName}`,
    markerEnd: { type: MarkerType.Arrow },
  };
}

const getOutputEdges = (graphSpec: GraphSpec) => {
  const outputEdges: Edge[] = Object.entries(graphSpec.outputValues ?? {}).map(
    ([outputName, argument]) => {
      const taskOutput = argument.taskOutput;
      const edge: Edge = {
        id: `${taskOutput.taskId}_${taskOutput.outputName}-Output_${outputName}`,
        source: `task_${taskOutput.taskId}`,
        sourceHandle: `output_${taskOutput.outputName}`,
        target: `output_${outputName}`,
        targetHandle: null,
        markerEnd: { type: MarkerType.Arrow },
      };
      return edge;
    }
  );
  return outputEdges;
}

export default useComponentSpecToEdges;
