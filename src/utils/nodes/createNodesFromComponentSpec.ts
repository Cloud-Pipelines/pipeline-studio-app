import { type Node } from "@xyflow/react";

import type { TaskNodeData } from "@/types/taskNode";
import type { ComponentSpec, GraphSpec } from "@/utils/componentSpec";

import { createInputNode } from "./createInputNode";
import { createOutputNode } from "./createOutputNode";
import { createTaskNode } from "./createTaskNode";

const createNodesFromComponentSpec = (
  componentSpec: ComponentSpec,
  nodeData: TaskNodeData,
): Node[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = createTaskNodes(graphSpec, nodeData);
  const inputNodes = createInputNodes(componentSpec);
  const outputNodes = createOutputNodes(componentSpec);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const createTaskNodes = (graphSpec: GraphSpec, nodeData: TaskNodeData) => {
  return Object.entries(graphSpec.tasks).map((task) =>
    createTaskNode(task, nodeData),
  );
};

const createInputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.inputs ?? []).map((inputSpec) =>
    createInputNode(inputSpec),
  );
};

const createOutputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.outputs ?? []).map((outputSpec) =>
    createOutputNode(outputSpec),
  );
};

export default createNodesFromComponentSpec;
