import { useMemo } from "react";

import type { TaskNodeDimensions } from "@/types/taskNode";
import type { TaskSpec } from "@/utils/componentSpec";
import { DEFAULT_NODE_DIMENSIONS } from "@/utils/constants";

const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;

type EditorPosition = {
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  w?: string;
  h?: string;
};

export function useTaskNodeDimensions(taskSpec: TaskSpec): TaskNodeDimensions {
  return useMemo(() => {
    let annotatedDimensions;
    try {
      const parsed = JSON.parse(
        taskSpec.annotations?.["editor.position"] as string,
      ) as EditorPosition | undefined;

      if (parsed) {
        const width = parsed.width ?? parsed.w;
        const height = parsed.height ?? parsed.h;

        annotatedDimensions = {
          x: !isNaN(Number(parsed.x)) ? parsed.x : undefined,
          y: !isNaN(Number(parsed.y)) ? parsed.y : undefined,
          width: !isNaN(Number(width)) ? width : undefined,
          height: !isNaN(Number(height)) ? height : undefined,
        };
      } else {
        annotatedDimensions = undefined;
      }
    } catch {
      annotatedDimensions = undefined;
    }
    return annotatedDimensions
      ? {
          w: Math.max(
            parseInt(annotatedDimensions.width ?? "") ||
              DEFAULT_NODE_DIMENSIONS.w,
            MIN_WIDTH,
          ),
          h:
            Math.max(parseInt(annotatedDimensions.height ?? ""), MIN_HEIGHT) ||
            DEFAULT_NODE_DIMENSIONS.h,
        }
      : DEFAULT_NODE_DIMENSIONS;
  }, [taskSpec]);
}
