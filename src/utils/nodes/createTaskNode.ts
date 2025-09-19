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
  const { nodeManager, callbacks, connectable, ...data } = nodeData;

  const newNodeId = nodeManager?.getNodeId(taskId, "task");
  console.log("Creating task node:", { taskId, nodeId: newNodeId });

  const position = extractPositionFromAnnotations(taskSpec.annotations);
  const nodeId = taskIdToNodeId(taskId);

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
