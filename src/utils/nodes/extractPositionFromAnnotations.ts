import type { XYPosition } from "@xyflow/react";

import type { MetadataSpec } from "@/utils/componentSpec";

export const extractPositionFromAnnotations = (
  annotations?: MetadataSpec["annotations"],
): XYPosition => {
  const defaultPosition: XYPosition = { x: 0, y: 0 };

  if (!annotations) return defaultPosition;

  try {
    const layoutAnnotation = annotations["editor.position"] as string;
    if (!layoutAnnotation) return defaultPosition;

    const decodedPosition = JSON.parse(layoutAnnotation);
    return {
      x: decodedPosition["x"] || 0,
      y: decodedPosition["y"] || 0,
    };
  } catch {
    return defaultPosition;
  }
};
