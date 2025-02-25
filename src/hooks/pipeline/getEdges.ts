import type { ComponentSpec } from "../../componentSpec";
import type { Edge } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

export const getEdges = (pipeline: ComponentSpec): Edge[] => {
  if (!("graph" in pipeline.implementation)) return [];

  return Object.entries(pipeline.implementation.graph.tasks).flatMap(([taskId, taskSpec]) =>
    Object.entries(taskSpec.arguments ?? {}).flatMap(([inputName, argument]) => {
      if (typeof argument === "string") return [];

      if ("taskOutput" in argument) {
        return [{
          id: `${argument.taskOutput.taskId}-${taskId}-${inputName}`,
          source: "task_" + argument.taskOutput.taskId,
          sourceHandle: `${argument.taskOutput.outputName}`,
          target: "task_" + taskId,
          targetHandle: `${inputName}`,
          type: 'task-edge',
          markerEnd: { type: MarkerType.ArrowClosed },
        }];
      }

      if ("graphInput" in argument) {
        return [{
          id: `input-${argument.graphInput.inputName}-${taskId}-${inputName}`,
          source: `${argument.graphInput.inputName}`,
          sourceHandle: `${argument.graphInput.inputName}`,
          target: "task_" + taskId,
          targetHandle: `input_${inputName}`,
          type: 'task-edge',
          markerEnd: { type: MarkerType.ArrowClosed },
        }];
      }

      return [];
    })
  );
};
