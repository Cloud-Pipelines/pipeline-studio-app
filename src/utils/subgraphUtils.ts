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

/**
 * Navigates to a specific subgraph within a ComponentSpec based on a path
 * @param componentSpec - The root component specification
 * @param subgraphPath - Array of task IDs representing the path to the desired subgraph
 * @returns ComponentSpec representing the subgraph, or the original spec if path is ["root"]
 */
export const getSubgraphComponentSpec = (
  componentSpec: ComponentSpec,
  subgraphPath: string[],
): ComponentSpec => {
  // If we're at root, return the original spec
  if (subgraphPath.length <= 1 || subgraphPath[0] !== "root") {
    return componentSpec;
  }

  // Navigate through the path to find the target subgraph
  let currentSpec = componentSpec;

  // Skip the "root" element and navigate through each task ID in the path
  for (let i = 1; i < subgraphPath.length; i++) {
    const taskId = subgraphPath[i];

    // Ensure current spec has a graph implementation
    if (!isGraphImplementation(currentSpec.implementation)) {
      console.warn(
        `Cannot navigate to subgraph: current spec does not have graph implementation at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // Find the task in the current graph
    const task = currentSpec.implementation.graph.tasks[taskId];
    if (!task) {
      console.warn(
        `Cannot navigate to subgraph: task "${taskId}" not found at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // Check if this task is a subgraph
    if (!isSubgraph(task)) {
      console.warn(
        `Cannot navigate to subgraph: task "${taskId}" is not a subgraph at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // Move to the subgraph's component spec
    currentSpec = task.componentRef.spec!;
  }

  return currentSpec;
};
