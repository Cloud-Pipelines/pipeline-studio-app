import type { ComponentReference, TaskSpec } from "../componentSpec";

export const generateTaskSpec = (
  componentRef: ComponentReference,
): TaskSpec => {
  return {
    componentRef,
    annotations: {
      "editor.position.x": "0",
      "editor.position.y": "0",
    } as { [k: string]: unknown },
  };
};
