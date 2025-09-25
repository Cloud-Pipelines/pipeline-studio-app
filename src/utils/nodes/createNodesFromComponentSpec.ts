import { type Node } from "@xyflow/react";

import type { TaskNodeData } from "@/types/taskNode";
import {
  type ComponentSpec,
  type GraphSpec,
  isGraphImplementation,
} from "@/utils/componentSpec";

import { createInputNode } from "./createInputNode";
import { createOutputNode } from "./createOutputNode";
import { createTaskNode } from "./createTaskNode";

const createNodesFromComponentSpec = (
  componentSpec: ComponentSpec,
  nodeData: TaskNodeData,
): Node[] => {
  if (!isGraphImplementation(componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = createTaskNodes(graphSpec, nodeData);
  const inputNodes = createInputNodes(componentSpec, nodeData);
  const outputNodes = createOutputNodes(componentSpec, nodeData);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const createTaskNodes = (graphSpec: GraphSpec, nodeData: TaskNodeData) => {
  return Object.entries(graphSpec.tasks).map((task) =>
    createTaskNode(task, nodeData),
  );
};

const createInputNodes = (
  componentSpec: ComponentSpec,
  nodeData: TaskNodeData,
) => {
  return (componentSpec.inputs ?? []).map((inputSpec) =>
    createInputNode(inputSpec, nodeData),
  );
};

const createOutputNodes = (
  componentSpec: ComponentSpec,
  nodeData: TaskNodeData,
) => {
  return (componentSpec.outputs ?? []).map((outputSpec) =>
    createOutputNode(outputSpec, nodeData),
  );
};

export default createNodesFromComponentSpec;
