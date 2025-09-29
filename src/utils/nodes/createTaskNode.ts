import { type Node } from "@xyflow/react";

import type { NodeData, TaskNodeData } from "@/types/nodes";

import type { TaskSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { convertNodeCallbacksToTaskCallbacks } from "./taskCallbackUtils";

export const createTaskNode = (
  task: [`${string}`, TaskSpec],
  nodeData: NodeData,
) => {
  const [taskId, taskSpec] = task;
  const { nodeManager, callbacks, connectable, ...data } = nodeData;

  const nodeId = nodeManager.getNodeId(taskId, "task");
  console.log("Creating task node:", { taskId, nodeId });

  const position = extractPositionFromAnnotations(taskSpec.annotations);

  const ids = { taskId, nodeId };
  const taskCallbacks = convertNodeCallbacksToTaskCallbacks(ids, callbacks);

  const taskNodeData: TaskNodeData = {
    ...data,
    taskSpec,
    taskId,
    connectable: connectable ?? true,
    highlighted: false,
    isGhost: false,
    callbacks: taskCallbacks,
  };

  return {
    id: nodeId,
    data: taskNodeData,
    position: position,
    type: "task",
  } as Node;
};
