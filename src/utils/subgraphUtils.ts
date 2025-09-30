import type { ComponentSpec, GraphSpec, TaskSpec } from "@/utils/componentSpec";

import { isGraphImplementation } from "./componentSpec";
import { ROOT_TASK_ID } from "./constants";
import { pluralize } from "./string";

type NotifyFunction = (
  message: string,
  type: "success" | "warning" | "error" | "info",
) => void;

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
 * Gets a human-readable description of the subgraph content
 */
export const getSubgraphDescription = (taskSpec: TaskSpec): string => {
  if (!isSubgraph(taskSpec)) {
    return "";
  }

  const subgraphSpec = taskSpec.componentRef.spec;
  if (!subgraphSpec || !isGraphImplementation(subgraphSpec.implementation)) {
    return "Empty subgraph";
  }

  const taskCount = Object.keys(subgraphSpec.implementation.graph.tasks).length;

  if (taskCount === 0) {
    return "Empty subgraph";
  }

  return `${taskCount} ${pluralize(taskCount, "task")}`;
};

/**
 * Navigates to a specific subgraph within a ComponentSpec based on a path
 * @param componentSpec - The root component specification
 * @param subgraphPath - Array of task IDs representing the path to the desired subgraph
 * @param notify - Optional notification function to display warnings
 * @returns ComponentSpec representing the subgraph, or the original spec if path is ["root"]
 */
export const getSubgraphComponentSpec = (
  componentSpec: ComponentSpec,
  subgraphPath: string[],
  notify?: NotifyFunction,
): ComponentSpec => {
  if (subgraphPath.length <= 1 || subgraphPath[0] !== ROOT_TASK_ID) {
    return componentSpec;
  }

  let currentSpec = componentSpec;

  for (let i = 1; i < subgraphPath.length; i++) {
    const taskId = subgraphPath[i];

    if (!isGraphImplementation(currentSpec.implementation)) {
      const message = `Cannot navigate to subgraph: current spec does not have graph implementation at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    const task = currentSpec.implementation.graph.tasks[taskId];
    if (!task) {
      const message = `Cannot navigate to subgraph: task "${taskId}" not found at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    if (!isSubgraph(task)) {
      const message = `Cannot navigate to subgraph: task "${taskId}" is not a subgraph at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    if (!task.componentRef.spec) {
      const message = `Cannot navigate to subgraph: task "${taskId}" has no spec at path ${subgraphPath.slice(0, i + 1).join(".")}`;
      if (notify) {
        notify(message, "warning");
      } else {
        console.warn(message);
      }
      return componentSpec;
    }

    currentSpec = task.componentRef.spec;
  }

  return currentSpec;
};

/**
 * Updates a nested subgraph's GraphSpec within a ComponentSpec
 * Returns a new ComponentSpec with the updated subgraph
 * @param componentSpec - The root component specification
 * @param subgraphPath - Array of task IDs representing the path to the subgraph
 * @param newGraphSpec - The new GraphSpec to set at the subgraph location
 * @returns New ComponentSpec with the updated subgraph
 */
export const updateSubgraphInComponentSpec = (
  componentSpec: ComponentSpec,
  subgraphPath: string[],
  newGraphSpec: GraphSpec,
): ComponentSpec => {
  // If we're at root, update the root graph directly
  if (subgraphPath.length <= 1 || subgraphPath[0] !== "root") {
    return {
      ...componentSpec,
      implementation: {
        ...componentSpec.implementation,
        graph: newGraphSpec,
      },
    };
  }

  // Create a deep copy to avoid mutations
  const newComponentSpec = JSON.parse(
    JSON.stringify(componentSpec),
  ) as ComponentSpec;

  // Navigate through the path to find the parent of the target subgraph
  let currentSpec = newComponentSpec;

  // Skip the "root" element and navigate through each task ID in the path
  for (let i = 1; i < subgraphPath.length; i++) {
    const taskId = subgraphPath[i];

    // Ensure current spec has a graph implementation
    if (!isGraphImplementation(currentSpec.implementation)) {
      console.error(
        `Cannot update subgraph: current spec does not have graph implementation at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // Find the task in the current graph
    const task = currentSpec.implementation.graph.tasks[taskId];
    if (!task) {
      console.error(
        `Cannot update subgraph: task "${taskId}" not found at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // Check if this task is a subgraph
    if (!isSubgraph(task)) {
      console.error(
        `Cannot update subgraph: task "${taskId}" is not a subgraph at path ${subgraphPath.slice(0, i + 1).join(".")}`,
      );
      return componentSpec;
    }

    // If this is the last item in the path, update its graph
    if (i === subgraphPath.length - 1) {
      task.componentRef.spec!.implementation = {
        ...task.componentRef.spec!.implementation,
        graph: newGraphSpec,
      };
      break;
    }

    // Otherwise, move to the subgraph's component spec
    currentSpec = task.componentRef.spec!;
  }

  return newComponentSpec;
};
