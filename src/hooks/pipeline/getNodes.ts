import type { ComponentSpec } from "../../componentSpec";
import type { Node } from "@xyflow/react";
import { getPositionFromAnnotations } from ".";

export const getTaskNodes = (pipeline: ComponentSpec): Node[] => {
  if (!("graph" in pipeline.implementation)) return [];

  return Object.entries(pipeline.implementation.graph.tasks).map(([taskId, taskSpec]) => ({
    id: "task_" + taskId,
    isConnectable: true,
    data: { taskSpec, taskId },
    position: getPositionFromAnnotations(taskSpec.annotations),
    type: "task",
  }));
};

export const getInputNodes = (pipeline: ComponentSpec): Node[] => {
  if (!("inputs" in pipeline)) return [];

  return (pipeline as ComponentSpec & { inputs: { name: string; annotations?: Record<string, unknown> }[] })
    .inputs.map((input) => ({
      id: `input_${input.name}`,
      data: { label: input.name },
      position: getPositionFromAnnotations(input.annotations),
      type: "input",
    }));
};
