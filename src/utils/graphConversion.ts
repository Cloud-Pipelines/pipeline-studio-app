import type { ComponentSpec, GraphSpec, TaskSpec } from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";
import {
  type FlattenedGraph,
  type FlattenedTask,
  getChildTasks,
  getTaskById,
  getTaskName,
  getTasksAtDepth,
  pathToHierarchicalId,
  ROOT_ID,
} from "./graphFlattening";

/**
 * Converts a flattened graph back to a nested ComponentSpec structure
 * This is the reverse operation of flattenGraph()
 */
export const reconstructComponentSpec = (
  flattenedGraph: FlattenedGraph,
): ComponentSpec => {
  const { originalSpec } = flattenedGraph;

  // Start with the original spec as a base
  const reconstructed: ComponentSpec = {
    ...originalSpec,
    implementation: {
      ...originalSpec.implementation,
    },
  };

  // If it's not a graph implementation, return as-is
  if (!isGraphImplementation(reconstructed.implementation)) {
    return reconstructed;
  }

  // Reconstruct the nested graph structure
  const rootGraph = reconstructGraph(flattenedGraph, [ROOT_ID]);
  reconstructed.implementation.graph = rootGraph;

  return reconstructed;
};

/**
 * Recursively reconstructs a graph spec from flattened tasks
 */
const reconstructGraph = (
  flattenedGraph: FlattenedGraph,
  currentPath: string[],
): GraphSpec => {
  const currentId = pathToHierarchicalId(currentPath);
  const childTasks = getChildTasks(flattenedGraph, currentId);

  const tasks: Record<string, TaskSpec> = {};

  childTasks.forEach((flattenedTask) => {
    const taskName = getTaskName(flattenedTask.id);
    let taskSpec = { ...flattenedTask.taskSpec };

    // If this task is a subgraph, recursively reconstruct its nested structure
    if (flattenedTask.isSubgraph && taskSpec.componentRef.spec) {
      const nestedGraph = reconstructGraph(flattenedGraph, flattenedTask.path);
      taskSpec = {
        ...taskSpec,
        componentRef: {
          ...taskSpec.componentRef,
          spec: {
            ...taskSpec.componentRef.spec,
            implementation: {
              ...taskSpec.componentRef.spec.implementation,
              graph: nestedGraph,
            },
          },
        },
      };
    }

    tasks[taskName] = taskSpec;
  });

  // Get the original graph spec for output values
  const originalGraph =
    currentPath.length === 1
      ? flattenedGraph.rootGraph
      : getOriginalGraphForPath(flattenedGraph, currentPath);

  return {
    tasks,
    outputValues: originalGraph?.outputValues || {},
  };
};

/**
 * Gets the original graph spec for a given path in the nested structure
 */
const getOriginalGraphForPath = (
  flattenedGraph: FlattenedGraph,
  path: string[],
): GraphSpec | null => {
  // Navigate through the original spec to find the graph at this path
  let currentSpec = flattenedGraph.originalSpec;

  // Skip root and navigate to the target
  for (let i = 1; i < path.length - 1; i++) {
    const taskId = path[i];
    if (!isGraphImplementation(currentSpec.implementation)) {
      return null;
    }

    const task = currentSpec.implementation.graph.tasks[taskId];
    if (!task?.componentRef.spec) {
      return null;
    }

    currentSpec = task.componentRef.spec;
  }

  if (isGraphImplementation(currentSpec.implementation)) {
    return currentSpec.implementation.graph;
  }

  return null;
};

/**
 * Updates a task in the flattened graph and returns a new flattened graph
 * This enables immutable updates to the graph structure
 */
export const updateTaskInFlattenedGraph = (
  flattenedGraph: FlattenedGraph,
  taskId: string,
  updatedTaskSpec: TaskSpec,
): FlattenedGraph => {
  const existingTask = getTaskById(flattenedGraph, taskId);
  if (!existingTask) {
    console.warn(`Task ${taskId} not found in flattened graph`);
    return flattenedGraph;
  }

  // Create new tasks map with the updated task
  const newTasks = new Map(flattenedGraph.tasks);
  const updatedTask: FlattenedTask = {
    ...existingTask,
    taskSpec: updatedTaskSpec,
    isSubgraph: isTaskSubgraph(updatedTaskSpec),
  };
  newTasks.set(taskId, updatedTask);

  return {
    ...flattenedGraph,
    tasks: newTasks,
  };
};

/**
 * Adds a new task to the flattened graph at a specific parent location
 */
export const addTaskToFlattenedGraph = (
  flattenedGraph: FlattenedGraph,
  parentId: string,
  taskName: string,
  taskSpec: TaskSpec,
): FlattenedGraph => {
  const parentTask = getTaskById(flattenedGraph, parentId);
  if (!parentTask && parentId !== pathToHierarchicalId([ROOT_ID])) {
    console.warn(`Parent task ${parentId} not found in flattened graph`);
    return flattenedGraph;
  }

  // Create the new task path
  const parentPath = parentTask ? parentTask.path : [ROOT_ID];
  const newTaskPath = [...parentPath, taskName];
  const newTaskId = pathToHierarchicalId(newTaskPath);

  // Check if task already exists
  if (flattenedGraph.tasks.has(newTaskId)) {
    console.warn(`Task ${newTaskId} already exists in flattened graph`);
    return flattenedGraph;
  }

  const newTask: FlattenedTask = {
    id: newTaskId,
    taskSpec,
    path: newTaskPath,
    depth: parentPath.length,
    parentId:
      parentId === pathToHierarchicalId([ROOT_ID]) ? undefined : parentId,
    isSubgraph: isTaskSubgraph(taskSpec),
  };

  // Create new tasks map with the new task
  const newTasks = new Map(flattenedGraph.tasks);
  newTasks.set(newTaskId, newTask);

  return {
    ...flattenedGraph,
    tasks: newTasks,
  };
};

/**
 * Removes a task from the flattened graph along with all its children
 */
export const removeTaskFromFlattenedGraph = (
  flattenedGraph: FlattenedGraph,
  taskId: string,
): FlattenedGraph => {
  const taskToRemove = getTaskById(flattenedGraph, taskId);
  if (!taskToRemove) {
    console.warn(`Task ${taskId} not found in flattened graph`);
    return flattenedGraph;
  }

  // Find all descendant tasks to remove
  const tasksToRemove = new Set<string>();
  const collectDescendants = (currentTaskId: string) => {
    tasksToRemove.add(currentTaskId);
    const children = getChildTasks(flattenedGraph, currentTaskId);
    children.forEach((child) => collectDescendants(child.id));
  };

  collectDescendants(taskId);

  // Create new tasks map without the removed tasks
  const newTasks = new Map(flattenedGraph.tasks);
  tasksToRemove.forEach((id) => newTasks.delete(id));

  return {
    ...flattenedGraph,
    tasks: newTasks,
  };
};

/**
 * Gets all tasks visible at a specific navigation path
 * This is used to determine what tasks should be shown in the UI
 */
export const getVisibleTasksForPath = (
  flattenedGraph: FlattenedGraph,
  navigationPath: string[],
): FlattenedTask[] => {
  // If at root level, show root-level tasks
  if (navigationPath.length <= 1 || navigationPath[0] !== ROOT_ID) {
    return getTasksAtDepth(flattenedGraph, 0);
  }

  // Convert navigation path to hierarchical ID and get child tasks
  const currentId = pathToHierarchicalId(navigationPath);
  return getChildTasks(flattenedGraph, currentId);
};

/**
 * Checks if a task is a subgraph by examining its component spec
 */
const isTaskSubgraph = (taskSpec: TaskSpec): boolean => {
  return (
    taskSpec.componentRef.spec !== undefined &&
    isGraphImplementation(taskSpec.componentRef.spec.implementation)
  );
};

/**
 * Validates that a flattened graph is consistent
 * Returns an array of validation errors
 */
export const validateFlattenedGraph = (
  flattenedGraph: FlattenedGraph,
): string[] => {
  const errors: string[] = [];
  const { tasks } = flattenedGraph;

  // Check that all parent references are valid
  tasks.forEach((task, taskId) => {
    if (task.parentId && !tasks.has(task.parentId)) {
      errors.push(
        `Task ${taskId} has invalid parent reference: ${task.parentId}`,
      );
    }

    // Check that path matches ID
    const expectedId = pathToHierarchicalId(task.path);
    if (taskId !== expectedId) {
      errors.push(
        `Task ${taskId} has inconsistent path: expected ${expectedId} from path ${task.path.join(".")}`,
      );
    }

    // Check depth consistency
    const expectedDepth = task.path.length - 1; // -1 because root doesn't count
    if (task.depth !== expectedDepth) {
      errors.push(
        `Task ${taskId} has inconsistent depth: expected ${expectedDepth}, got ${task.depth}`,
      );
    }
  });

  return errors;
};
