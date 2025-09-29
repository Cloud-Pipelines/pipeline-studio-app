import type { ComponentSpec, TaskSpec } from "./componentSpec";
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
