import type { DragEvent } from "react";

import type { TaskType } from "@/types/nodes";
import type { TaskSpec } from "@/utils/componentSpec";

export const getTaskFromEvent = (event: DragEvent) => {
  const droppedData = event.dataTransfer.getData("application/reactflow");
  if (droppedData === "") {
    return { taskSpec: null, taskType: null };
  }
  const droppedDataObject = JSON.parse(droppedData);
  const taskType = Object.keys(droppedDataObject)[0] as TaskType;

  const taskSpec = droppedDataObject[taskType] as TaskSpec | null;

  return { taskSpec, taskType };
};
