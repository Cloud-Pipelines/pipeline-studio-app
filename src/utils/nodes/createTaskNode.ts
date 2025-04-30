import { type Node } from "@xyflow/react";

import type { TaskSpec } from "../componentSpec";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import {
  generateDynamicNodeCallbacks,
  type NodeCallbacks,
} from "./generateDynamicNodeCallbacks";
import { taskIdToNodeId } from "./nodeIdUtils";

export const createTaskNode = (
  task: [`${string}`, TaskSpec],
  readOnly: boolean,
  nodeCallbacks: NodeCallbacks,
) => {
  const [taskId, taskSpec] = task;

  const position = extractPositionFromAnnotations(taskSpec.annotations);
  const selected = taskSpec.annotations?.selected;
  const nodeId = taskIdToNodeId(taskId);

  // Inject the taskId and nodeId into the callbacks
  const dynamicCallbacks = generateDynamicNodeCallbacks(nodeCallbacks, nodeId);

  return {
    id: nodeId,
    data: {
      readOnly,
      taskSpec,
      taskId,
      ...dynamicCallbacks,
    },
    position: position,
    type: "task",
    selected: selected,
  } as Node;
};
