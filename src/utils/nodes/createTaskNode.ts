import { type Node } from "@xyflow/react";

import type { NodeData, TaskNodeData } from "@/types/nodes";

import type { TaskSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { taskIdToNodeId } from "./nodeIdUtils";
import { convertNodeCallbacksToTaskCallbacks } from "./taskCallbackUtils";

export const createTaskNode = (
  task: [`${string}`, TaskSpec],
  nodeData: NodeData,
) => {
  const [taskId, taskSpec] = task;
  const { callbacks, connectable = true, ...data } = nodeData;

  const position = extractPositionFromAnnotations(taskSpec.annotations);
  const nodeId = taskIdToNodeId(taskId);

  // Inject the taskId and nodeId into the callbacks
  const taskCallbacks = convertNodeCallbacksToTaskCallbacks(
    { taskId, nodeId },
    callbacks,
  );

  const taskNodeData: TaskNodeData = {
    ...data,
    taskSpec,
    taskId,
    connectable,
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
