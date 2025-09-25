import type { ReactNode } from "react";

import { withSuspenseWrapper } from "../SuspenseWrapper";
import { useComponentCanvasTasks } from "./hooks/useComponentCanvasTasks";

export const ComponentUsageCount = withSuspenseWrapper(
  ({
    digest,
    children,
  }: {
    digest: string;
    children: (count: number) => ReactNode;
  }) => {
    const tasksOnCanvas = useComponentCanvasTasks(digest);

    if (tasksOnCanvas.length === 0) {
      return null;
    }

    return children(tasksOnCanvas.length);
  },
);
