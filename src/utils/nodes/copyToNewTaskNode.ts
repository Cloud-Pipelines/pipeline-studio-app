import { type Node, type XYPosition } from "@xyflow/react";

import type { TaskNodeData } from "@/types/taskNode";

import type { GraphSpec, TaskSpec } from "../componentSpec";
import { getUniqueTaskName } from "../unique";
import { createTaskNode } from "./createTaskNode";
import type { NodeCallbacks } from "./generateDynamicNodeCallbacks";
import { setPositionInAnnotations } from "./setPositionInAnnotations";

export const copyToNewTaskNode = (
  node: Node,
  nodeCallbacks: NodeCallbacks,
  position: XYPosition,
  graphSpec: GraphSpec,
) => {
  const updatedGraphSpec = { ...graphSpec };

  const data = node.data as TaskNodeData;

  const taskSpec = data.taskSpec as TaskSpec;
  const annotations = taskSpec.annotations || {};

  const updatedTaskSpec = {
    ...taskSpec,
  };

  const taskId = getUniqueTaskName(
    updatedGraphSpec,
    updatedTaskSpec.componentRef.spec?.name,
  );

  // Remove Argument links to other nodes
  if (updatedTaskSpec.arguments) {
    updatedTaskSpec.arguments = Object.fromEntries(
      Object.entries(updatedTaskSpec.arguments).filter(([_key, value]) => {
        return !(value && typeof value === "object" && "taskOutput" in value);
      }),
    );
  }

  const newNode = createTaskNode(
    [taskId, updatedTaskSpec],
    data.readOnly as boolean,
    nodeCallbacks,
  );

  const centeredPosition = {
    x: position.x - (newNode.width || 0) / 2,
    y: position.y - (newNode.height || 0) / 2,
  };

  const updatedAnnotations = setPositionInAnnotations(
    annotations,
    centeredPosition,
  );

  updatedGraphSpec.tasks[taskId] = {
    ...updatedTaskSpec,
    annotations: {
      ...updatedAnnotations,
      selected: true,
    },
  };

  newNode.position = centeredPosition;

  return { newNode, updatedGraphSpec };
};
