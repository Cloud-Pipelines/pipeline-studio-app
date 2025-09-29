import type { ComponentSpec, GraphSpec, TaskSpec } from "./componentSpec";
import { isGraphImplementation } from "./componentSpec";

/**
 * Hierarchical ID separator for nested task identification
 * Format: root.subgraph1.task2.nestedSubgraph.finalTask
 */
export const ID_SEPARATOR = ".";

/**
 * Root identifier for the main graph
 */
export const ROOT_ID = "root";

/**
 * Represents a flattened task with its hierarchical context
 */
export interface FlattenedTask {
  /** Hierarchical ID (e.g., "root.subgraph1.task2") */
  id: string;
  /** Original task specification */
  taskSpec: TaskSpec;
  /** Path segments from root to this task */
  path: string[];
  /** Depth in the hierarchy (0 = root level) */
  depth: number;
  /** Parent task ID (undefined for root-level tasks) */
  parentId?: string;
  /** Whether this task is itself a subgraph */
  isSubgraph: boolean;
}

/**
 * Internal representation of a flattened graph
 */
export interface FlattenedGraph {
  /** Map of hierarchical ID to flattened task */
  tasks: Map<string, FlattenedTask>;
  /** Original component spec */
  originalSpec: ComponentSpec;
  /** Root graph spec for quick access */
  rootGraph: GraphSpec;
}

/**
 * Creates a hierarchical ID from path segments
 */
export const createHierarchicalId = (path: string[]): string => {
  return path.join(ID_SEPARATOR);
};

/**
 * Parses a hierarchical ID into path segments
 */
export const parseHierarchicalId = (id: string): string[] => {
  return id.split(ID_SEPARATOR);
};

/**
 * Gets the parent ID from a hierarchical ID
 */
export const getParentId = (id: string): string | undefined => {
  const segments = parseHierarchicalId(id);
  if (segments.length <= 1) {
    return undefined;
  }
  return createHierarchicalId(segments.slice(0, -1));
};

/**
 * Gets the immediate task name from a hierarchical ID
 */
export const getTaskName = (id: string): string => {
  const segments = parseHierarchicalId(id);
  return segments[segments.length - 1];
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
 * Recursively flattens a nested graph structure into a flat representation
 */
export const flattenGraph = (componentSpec: ComponentSpec): FlattenedGraph => {
  const tasks = new Map<string, FlattenedTask>();

  if (!isGraphImplementation(componentSpec.implementation)) {
    return {
      tasks,
      originalSpec: componentSpec,
      rootGraph: { tasks: {} },
    };
  }

  const rootGraph = componentSpec.implementation.graph;

  /**
   * Recursively processes tasks and their nested subgraphs
   */
  const processTasks = (
    graphSpec: GraphSpec,
    currentPath: string[],
    depth: number,
  ): void => {
    Object.entries(graphSpec.tasks).forEach(([taskId, taskSpec]) => {
      const taskPath = [...currentPath, taskId];
      const hierarchicalId = createHierarchicalId(taskPath);
      const parentId = getParentId(hierarchicalId);
      const isSubgraph = isTaskSubgraph(taskSpec);

      // Create flattened task entry
      const flattenedTask: FlattenedTask = {
        id: hierarchicalId,
        taskSpec,
        path: taskPath,
        depth,
        parentId: depth === 0 ? undefined : parentId,
        isSubgraph,
      };

      tasks.set(hierarchicalId, flattenedTask);

      // Recursively process subgraph if this task contains one
      if (isSubgraph && taskSpec.componentRef.spec) {
        const subgraphSpec = taskSpec.componentRef.spec;
        if (isGraphImplementation(subgraphSpec.implementation)) {
          processTasks(subgraphSpec.implementation.graph, taskPath, depth + 1);
        }
      }
    });
  };

  // Start processing from root
  processTasks(rootGraph, [ROOT_ID], 0);

  return {
    tasks,
    originalSpec: componentSpec,
    rootGraph,
  };
};

/**
 * Gets all tasks at a specific depth level
 */
export const getTasksAtDepth = (
  flattenedGraph: FlattenedGraph,
  depth: number,
): FlattenedTask[] => {
  return Array.from(flattenedGraph.tasks.values()).filter(
    (task) => task.depth === depth,
  );
};

/**
 * Gets all child tasks of a specific parent
 */
export const getChildTasks = (
  flattenedGraph: FlattenedGraph,
  parentId: string,
): FlattenedTask[] => {
  return Array.from(flattenedGraph.tasks.values()).filter(
    (task) => task.parentId === parentId,
  );
};

/**
 * Gets the flattened task by hierarchical ID
 */
export const getTaskById = (
  flattenedGraph: FlattenedGraph,
  id: string,
): FlattenedTask | undefined => {
  return flattenedGraph.tasks.get(id);
};

/**
 * Checks if a task exists in the flattened graph
 */
export const hasTask = (
  flattenedGraph: FlattenedGraph,
  id: string,
): boolean => {
  return flattenedGraph.tasks.has(id);
};

/**
 * Gets all tasks that are subgraphs
 */
export const getSubgraphTasks = (
  flattenedGraph: FlattenedGraph,
): FlattenedTask[] => {
  return Array.from(flattenedGraph.tasks.values()).filter(
    (task) => task.isSubgraph,
  );
};

/**
 * Converts a path array to a hierarchical ID for navigation compatibility
 */
export const pathToHierarchicalId = (path: string[]): string => {
  return createHierarchicalId(path);
};

/**
 * Converts a hierarchical ID back to a path array for navigation compatibility
 */
export const hierarchicalIdToPath = (id: string): string[] => {
  return parseHierarchicalId(id);
};
