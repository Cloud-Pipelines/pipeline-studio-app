import { type Node } from "@xyflow/react";

import type { ComponentSpec, GraphSpec } from "@/utils/componentSpec";
import { extractPositionFromAnnotations } from "@/utils/nodes/extractPositionFromAnnotations";

import { createTaskNode } from "./createTaskNode";
import { type NodeCallbacks } from "./generateDynamicNodeCallbacks";

export const createNodesFromComponentSpec = (
  componentSpec: ComponentSpec,
  nodeCallbacks: NodeCallbacks,
): Node[] => {
  if (!("graph" in componentSpec.implementation)) {
    return [];
  }

  const graphSpec = componentSpec.implementation.graph;
  const taskNodes = createTaskNodes(graphSpec, nodeCallbacks);
  const inputNodes = createInputNodes(componentSpec);
  const outputNodes = createOutputNodes(componentSpec);

  return [...taskNodes, ...inputNodes, ...outputNodes];
};

const createTaskNodes = (
  graphSpec: GraphSpec,
  nodeCallbacks: NodeCallbacks,
) => {
  return Object.entries(graphSpec.tasks).map((task) => {
    return createTaskNode(task, nodeCallbacks);
  });
};

const createInputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.inputs ?? []).map((inputSpec) => {
    const position = extractPositionFromAnnotations(inputSpec.annotations);

    return {
      id: `input_${inputSpec.name}`,
      data: { label: inputSpec.name },
      position: position,
      type: "input",
    } as Node;
  });
};

const createOutputNodes = (componentSpec: ComponentSpec) => {
  return (componentSpec.outputs ?? []).map((outputSpec) => {
    const position = extractPositionFromAnnotations(outputSpec.annotations);

    return {
      id: `output_${outputSpec.name}`,
      data: { label: outputSpec.name },
      position: position,
      type: "output",
    } as Node;
  });
};

export default createNodesFromComponentSpec;
