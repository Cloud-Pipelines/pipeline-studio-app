import type { XYPosition } from "@xyflow/react";

export const setPositionInAnnotations = (
  annotations: Record<string, unknown>,
  position: XYPosition,
): Record<string, unknown> => {
  const updatedAnnotations = { ...annotations };
  updatedAnnotations["editor.position"] = JSON.stringify(position);
  return updatedAnnotations;
};
