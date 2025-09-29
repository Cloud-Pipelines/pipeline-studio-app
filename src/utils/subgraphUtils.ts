import type { ComponentSpec, TaskSpec } from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";

/**
 * Determines if a task specification represents a subgraph (contains nested graph implementation)
 */
export const isSubgraph = (taskSpec: TaskSpec): boolean => {
  return Boolean(
    taskSpec.componentRef.spec &&
      isGraphImplementation(taskSpec.componentRef.spec.implementation),
  );
};

/**
 * Gets the number of tasks within a subgraph
 */
export const getSubgraphTaskCount = (taskSpec: TaskSpec): number => {
  if (!isSubgraph(taskSpec)) {
    return 0;
  }

  const subgraphSpec = taskSpec.componentRef.spec!;
  if (!isGraphImplementation(subgraphSpec.implementation)) {
    return 0;
  }

  return Object.keys(subgraphSpec.implementation.graph.tasks).length;
};

/**
 * Gets a human-readable description of the subgraph content
 */
export const getSubgraphDescription = (taskSpec: TaskSpec): string => {
  if (!isSubgraph(taskSpec)) {
    return "";
  }

  const taskCount = getSubgraphTaskCount(taskSpec);

  if (taskCount === 0) {
    return "Empty subgraph";
  }

  return `${taskCount} task${taskCount === 1 ? "" : "s"}`;
};

/**
 * Type guard to check if a task spec is a subgraph with proper typing
 */
export const isSubgraphTaskSpec = (
  taskSpec: TaskSpec,
): taskSpec is TaskSpec & {
  componentRef: {
    spec: ComponentSpec & {
      implementation: { graph: any };
    };
  };
} => {
  return isSubgraph(taskSpec);
};
