import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRequiredContext } from "@/hooks/useRequiredContext";
import type { ComponentSpec } from "@/utils/componentSpec";
import {
  type FlattenedGraph,
  type FlattenedTask,
  flattenGraph,
  getChildTasks,
  getSubgraphTasks,
  getTaskById,
  getTasksAtDepth,
  hasTask,
  hierarchicalIdToPath,
  pathToHierarchicalId,
  ROOT_ID,
} from "@/utils/graphFlattening";

import { createRequiredContext } from "../hooks/useRequiredContext";

interface FlattenedGraphContextType {
  /** Current flattened graph representation */
  flattenedGraph: FlattenedGraph | null;
  /** Whether the graph is currently being processed */
  isFlattening: boolean;

  // Query functions
  /** Get a task by its hierarchical ID */
  getTask: (id: string) => FlattenedTask | undefined;
  /** Check if a task exists */
  taskExists: (id: string) => boolean;
  /** Get all tasks at a specific depth level */
  getTasksAtDepth: (depth: number) => FlattenedTask[];
  /** Get all child tasks of a parent */
  getChildTasks: (parentId: string) => FlattenedTask[];
  /** Get all subgraph tasks */
  getSubgraphTasks: () => FlattenedTask[];

  // Navigation compatibility functions
  /** Convert navigation path to hierarchical ID */
  pathToId: (path: string[]) => string;
  /** Convert hierarchical ID to navigation path */
  idToPath: (id: string) => string[];
  /** Get tasks visible at current navigation path */
  getVisibleTasks: (currentPath: string[]) => FlattenedTask[];
}

const FlattenedGraphContext = createRequiredContext<FlattenedGraphContextType>(
  "FlattenedGraphProvider",
);

interface FlattenedGraphProviderProps {
  children: ReactNode;
  /** Component spec to flatten */
  componentSpec: ComponentSpec | null;
}

export const FlattenedGraphProvider = ({
  children,
  componentSpec,
}: FlattenedGraphProviderProps) => {
  const [flattenedGraph, setFlattenedGraph] = useState<FlattenedGraph | null>(
    null,
  );
  const [isFlattening, setIsFlattening] = useState(false);

  // Flatten the graph when componentSpec changes
  useEffect(() => {
    if (!componentSpec) {
      setFlattenedGraph(null);
      return;
    }

    setIsFlattening(true);

    // Use setTimeout to prevent blocking the UI for large graphs
    const timeoutId = setTimeout(() => {
      try {
        const flattened = flattenGraph(componentSpec);
        setFlattenedGraph(flattened);
      } catch (error) {
        console.error("Error flattening graph:", error);
        setFlattenedGraph(null);
      } finally {
        setIsFlattening(false);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      setIsFlattening(false);
    };
  }, [componentSpec]);

  // Query functions
  const getTask = useCallback(
    (id: string): FlattenedTask | undefined => {
      return flattenedGraph ? getTaskById(flattenedGraph, id) : undefined;
    },
    [flattenedGraph],
  );

  const taskExists = useCallback(
    (id: string): boolean => {
      return flattenedGraph ? hasTask(flattenedGraph, id) : false;
    },
    [flattenedGraph],
  );

  const getTasksAtDepthFn = useCallback(
    (depth: number): FlattenedTask[] => {
      return flattenedGraph ? getTasksAtDepth(flattenedGraph, depth) : [];
    },
    [flattenedGraph],
  );

  const getChildTasksFn = useCallback(
    (parentId: string): FlattenedTask[] => {
      return flattenedGraph ? getChildTasks(flattenedGraph, parentId) : [];
    },
    [flattenedGraph],
  );

  const getSubgraphTasksFn = useCallback((): FlattenedTask[] => {
    return flattenedGraph ? getSubgraphTasks(flattenedGraph) : [];
  }, [flattenedGraph]);

  // Navigation compatibility functions
  const pathToId = useCallback((path: string[]): string => {
    return pathToHierarchicalId(path);
  }, []);

  const idToPath = useCallback((id: string): string[] => {
    return hierarchicalIdToPath(id);
  }, []);

  const getVisibleTasks = useCallback(
    (currentPath: string[]): FlattenedTask[] => {
      if (!flattenedGraph) return [];

      // Convert path to hierarchical ID
      const currentId = pathToHierarchicalId(currentPath);

      // If we're at root, get root-level tasks (depth 0)
      if (currentPath.length <= 1 || currentPath[0] !== ROOT_ID) {
        return getTasksAtDepth(flattenedGraph, 0);
      }

      // Get child tasks of the current subgraph
      return getChildTasks(flattenedGraph, currentId);
    },
    [flattenedGraph],
  );

  const value = useMemo(
    () => ({
      flattenedGraph,
      isFlattening,
      getTask,
      taskExists,
      getTasksAtDepth: getTasksAtDepthFn,
      getChildTasks: getChildTasksFn,
      getSubgraphTasks: getSubgraphTasksFn,
      pathToId,
      idToPath,
      getVisibleTasks,
    }),
    [
      flattenedGraph,
      isFlattening,
      getTask,
      taskExists,
      getTasksAtDepthFn,
      getChildTasksFn,
      getSubgraphTasksFn,
      pathToId,
      idToPath,
      getVisibleTasks,
    ],
  );

  return (
    <FlattenedGraphContext.Provider value={value}>
      {children}
    </FlattenedGraphContext.Provider>
  );
};

export const useFlattenedGraph = () => {
  return useRequiredContext(FlattenedGraphContext);
};
