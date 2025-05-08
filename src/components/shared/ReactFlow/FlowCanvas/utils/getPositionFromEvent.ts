import type { ReactFlowInstance } from "@xyflow/react";
import type { DragEvent } from "react";

export const getPositionFromEvent = (
  event: DragEvent,
  reactFlowInstance: ReactFlowInstance,
) => {
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const dragStartOffsetData = event.dataTransfer.getData("DragStart.offset");
  if (dragStartOffsetData !== "") {
    const dragStartOffset = JSON.parse(dragStartOffsetData);
    dragOffsetX = dragStartOffset.offsetX ?? 0;
    dragOffsetY = dragStartOffset.offsetY ?? 0;
  }

  // Node position. Offsets should be included in projection, so that they snap to the grid.
  // Otherwise the dropped nodes will be out of phase with the rest of the nodes even when snapping.
  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX - dragOffsetX,
    y: event.clientY - dragOffsetY,
  });

  return position;
};
