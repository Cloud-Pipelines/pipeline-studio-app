import {
  type Edge,
  type EdgeChange,
  MarkerType,
  useEdgesState,
} from "@xyflow/react";
import { useEffect } from "react";

import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  TaskOutputArgument,
  TaskSpec,
} from "@/utils/componentSpec";
import {
  inputNameToNodeId,
  outputNameToNodeId,
  taskIdToNodeId,
} from "@/utils/nodes/nodeIdUtils";

const useComponentSpecToEdges = (
  componentSpec: ComponentSpec,
): {
  edges: Edge<any>[];
  onEdgesChange: (changes: EdgeChange[]) => void;
} => {
  const isSmartEdgeWithBridgesEnabled = useBetaFlagValue("smart-edge-bridges");

  const edgeType = isSmartEdgeWithBridgesEnabled ? "smart" : "customEdge";

  const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(
    getEdges(componentSpec, edgeType),
  );

  useEffect(() => {
    const newEdges = getEdges(componentSpec, edgeType);
    setFlowEdges(newEdges);
  }, [componentSpec, edgeType]);

  return {
    edges: flowEdges,
    onEdgesChange: onFlowEdgesChange,
  };
};

const getEdges = (
  componentSpec: ComponentSpec,
  edgeType: "smart" | "customEdge",
) => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskEdges = createEdgesFromTaskSpec(graphSpec, edgeType);
  const outputEdges = createOutputEdgesFromGraphSpec(graphSpec, edgeType);
  return [...taskEdges, ...outputEdges];
};

const createEdgesFromTaskSpec = (
  graphSpec: GraphSpec,
  edgeType: "smart" | "customEdge",
) => {
  const edges: Edge[] = Object.entries(graphSpec.tasks).flatMap(
    ([taskId, taskSpec]) => createEdgesForTask(taskId, taskSpec, edgeType),
  );
  return edges;
};

const createEdgesForTask = (
  taskId: string,
  taskSpec: TaskSpec,
  edgeType: "smart" | "customEdge",
): Edge[] => {
  return Object.entries(taskSpec.arguments ?? {}).flatMap(
    ([inputName, argument]) =>
      createEdgeForArgument(taskId, inputName, argument, edgeType),
  );
};

const createEdgeForArgument = (
  taskId: string,
  inputName: string,
  argument: ArgumentType,
  edgeType: "smart" | "customEdge",
): Edge[] => {
  if (typeof argument === "string") {
    return [];
  }

  if ("taskOutput" in argument) {
    return [
      createTaskOutputEdge(taskId, inputName, argument.taskOutput, edgeType),
    ];
  }

  if ("graphInput" in argument) {
    return [
      createGraphInputEdge(taskId, inputName, argument.graphInput, edgeType),
    ];
  }

  console.error("Impossible task input argument kind: ", argument);
  return [];
};

const createTaskOutputEdge = (
  taskId: string,
  inputName: string,
  taskOutput: TaskOutputArgument["taskOutput"],
  edgeType: "smart" | "customEdge",
): Edge => {
  return {
    id: `${taskOutput.taskId}_${taskOutput.outputName}-${taskId}_${inputName}`,
    source: taskIdToNodeId(taskOutput.taskId),
    sourceHandle: outputNameToNodeId(taskOutput.outputName),
    target: taskIdToNodeId(taskId),
    targetHandle: inputNameToNodeId(inputName),
    markerEnd: { type: MarkerType.Arrow },
    label: `$${inputName}`,
    type: edgeType,
  };
};

const createGraphInputEdge = (
  taskId: string,
  inputName: string,
  graphInput: GraphInputArgument["graphInput"],
  edgeType: "smart" | "customEdge",
): Edge => {
  return {
    id: `${inputName}`,
    source: inputNameToNodeId(graphInput.inputName),
    sourceHandle: null,
    target: taskIdToNodeId(taskId),
    targetHandle: inputNameToNodeId(inputName),
    type: edgeType,
    markerEnd: { type: MarkerType.Arrow },
  };
};

const createOutputEdgesFromGraphSpec = (
  graphSpec: GraphSpec,
  edgeType: "smart" | "customEdge",
) => {
  const outputEdges: Edge[] = Object.entries(graphSpec.outputValues ?? {}).map(
    ([outputName, argument]) => {
      const taskOutput = argument.taskOutput;
      const edge: Edge = {
        id: `${taskOutput.taskId}_${taskOutput.outputName}-Output_${outputName}`,
        source: taskIdToNodeId(taskOutput.taskId),
        sourceHandle: outputNameToNodeId(taskOutput.outputName),
        target: outputNameToNodeId(outputName),
        targetHandle: null,
        type: edgeType,
        data: {
          label: `${outputName}`,
        },
        markerEnd: { type: MarkerType.Arrow },
      };
      return edge;
    },
  );
  return outputEdges;
};

export default useComponentSpecToEdges;
