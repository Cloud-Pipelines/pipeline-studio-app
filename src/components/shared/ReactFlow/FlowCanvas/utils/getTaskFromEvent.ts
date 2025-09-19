import type { DragEvent } from "react";

import type { NodeType } from "@/types/nodes";
import type { TaskSpec } from "@/utils/componentSpec";

export const getTaskFromEvent = (event: DragEvent) => {
  const droppedData = event.dataTransfer.getData("application/reactflow");
  if (droppedData === "") {
    return { taskSpec: null, nodeType: null };
  }
  const droppedDataObject = JSON.parse(droppedData);
  const nodeType = Object.keys(droppedDataObject)[0] as NodeType;

  const taskSpec = droppedDataObject[nodeType] as TaskSpec | null;

  return { taskSpec, nodeType };
};
