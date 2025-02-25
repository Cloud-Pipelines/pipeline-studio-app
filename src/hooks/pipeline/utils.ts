import type { XYPosition } from "@xyflow/react";
import type { ComponentSpec } from "../../componentSpec";

export const getPositionFromAnnotations = (annotations?: Record<string, unknown>): XYPosition => {
  if (!annotations?.["editor.position"]) return { x: 0, y: 0 };

  try {
    const position = JSON.parse(annotations["editor.position"] as string);
    if (typeof position?.x === "number" && typeof position?.y === "number") {
      return { x: position.x, y: position.y };
    }
  } catch {
    console.debug("Failed to parse position annotation");
  }
  return { x: 0, y: 0 };
};

export const isValidComponentSpec = (spec: unknown): spec is ComponentSpec => {
  return spec !== null && typeof spec === "object" && "name" in spec;
};
