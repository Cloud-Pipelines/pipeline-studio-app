import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type UndoRedo, useUndoRedo } from "@/hooks/useUndoRedo";
import { loadPipelineByName } from "@/services/pipelineService";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";
import { checkComponentSpecValidity } from "@/utils/validations";

import {
  createRequiredContext,
  useRequiredContext,
} from "../hooks/useRequiredContext";
import {
  type ComponentSpec,
  type GraphSpec,
  isGraphImplementation,
} from "../utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  componentSpecToYaml,
  writeComponentToFileListFromText,
} from "../utils/componentStore";
import {
  getSubgraphComponentSpec,
  updateSubgraphInComponentSpec,
} from "../utils/subgraphUtils";

const EMPTY_GRAPH_SPEC: GraphSpec = {
  tasks: {},
};

export const EMPTY_GRAPH_COMPONENT_SPEC: ComponentSpec = {
  implementation: {
    graph: EMPTY_GRAPH_SPEC,
  },
};
interface ComponentSpecContextType {
  componentSpec: ComponentSpec;
  setComponentSpec: (spec: ComponentSpec) => void;
  clearComponentSpec: () => void;
  graphSpec: GraphSpec;
  isLoading: boolean;
  isValid: boolean;
  errors: string[];
  refetch: () => void;
  updateGraphSpec: (newGraphSpec: GraphSpec) => void;
  saveComponentSpec: (name: string) => Promise<void>;
  taskStatusMap: Map<string, string>;
  setTaskStatusMap: (taskStatusMap: Map<string, string>) => void;
  undoRedo: UndoRedo;

  currentSubgraphPath: string[];
  navigateToSubgraph: (taskId: string) => void;
  navigateBack: () => void;
  navigateToPath: (targetPath: string[]) => void;
  canNavigateBack: boolean;
}

const ComponentSpecContext = createRequiredContext<ComponentSpecContextType>(
  "ComponentSpecProvider",
);

export const ComponentSpecProvider = ({
  spec,
  readOnly = false,
  children,
}: {
  spec?: ComponentSpec;
  readOnly?: boolean;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { subgraph?: string };

  const [componentSpec, setComponentSpec] = useState<ComponentSpec>(
    spec ?? EMPTY_GRAPH_COMPONENT_SPEC,
  );

  const [taskStatusMap, setTaskStatusMap] = useState<Map<string, string>>(
    new Map(),
  );

  const [isLoading, setIsLoading] = useState(!!spec);

  // Initialize from URL on mount
  const initialSubgraphPath = useMemo(() => {
    if (search.subgraph) {
      return search.subgraph.split(".");
    }
    return ["root"];
  }, [search.subgraph]);

  const [currentSubgraphPath, setCurrentSubgraphPath] =
    useState<string[]>(initialSubgraphPath);

  const undoRedo = useUndoRedo(componentSpec, setComponentSpec);
  const undoRedoRef = useRef(undoRedo);
  undoRedoRef.current = undoRedo;

  const { isValid, errors } = useMemo(
    () => checkComponentSpecValidity(componentSpec),
    [componentSpec],
  );

  const clearComponentSpec = useCallback(() => {
    setComponentSpec(EMPTY_GRAPH_COMPONENT_SPEC);
    setTaskStatusMap(new Map());
    setIsLoading(false);
    setCurrentSubgraphPath(["root"]);
    undoRedoRef.current.clearHistory();
  }, []);

  // Get the GraphSpec for the currently viewed subgraph
  const graphSpec = useMemo(() => {
    const currentSpec = getSubgraphComponentSpec(
      componentSpec,
      currentSubgraphPath,
    );

    if (isGraphImplementation(currentSpec.implementation)) {
      return currentSpec.implementation.graph;
    }

    return EMPTY_GRAPH_SPEC;
  }, [componentSpec, currentSubgraphPath]);

  const loadPipeline = useCallback(
    async (newName?: string) => {
      if (componentSpec) {
        setComponentSpec(componentSpec);
      }

      const name = newName ?? componentSpec.name;
      if (!name) return;

      const result = await loadPipelineByName(name);
      if (!result.experiment) return;

      const preparedComponentRef = await prepareComponentRefForEditor(
        result.experiment.componentRef as ComponentReferenceWithSpec,
      );

      if (!preparedComponentRef) {
        console.error("Failed to prepare component reference for editor");
        return;
      }

      setComponentSpec(preparedComponentRef);
      setIsLoading(false);
    },
    [componentSpec],
  );

  const refetch = useCallback(() => {
    loadPipeline();
  }, [loadPipeline]);

  const saveComponentSpec = useCallback(
    async (name: string) => {
      if (readOnly) {
        return;
      }

      const specWithName = { ...componentSpec, name };

      const componentText = componentSpecToYaml(specWithName);
      await writeComponentToFileListFromText(
        USER_PIPELINES_LIST_NAME,
        name,
        componentText,
      );
    },
    [componentSpec, readOnly],
  );

  // Update the GraphSpec for the currently viewed subgraph
  const updateGraphSpec = useCallback(
    (newGraphSpec: GraphSpec) => {
      setComponentSpec((prevSpec) => {
        // If we're at root, update directly
        if (currentSubgraphPath.length <= 1) {
          return {
            ...prevSpec,
            implementation: {
              ...prevSpec.implementation,
              graph: newGraphSpec,
            },
          };
        }

        // Otherwise, update the nested subgraph
        return updateSubgraphInComponentSpec(
          prevSpec,
          currentSubgraphPath,
          newGraphSpec,
        );
      });
    },
    [currentSubgraphPath],
  );

  const navigateToSubgraph = useCallback(
    (taskId: string) => {
      setCurrentSubgraphPath((prev) => {
        const newPath = [...prev, taskId];
        // Update URL - Dynamic search params work at runtime but aren't type-safe
        (navigate as any)({
          search: (old: Record<string, unknown>) => ({
            ...old,
            subgraph: newPath.join("."),
          }),
          replace: false,
        });
        return newPath;
      });
    },
    [navigate],
  );

  const navigateBack = useCallback(() => {
    setCurrentSubgraphPath((prev) => {
      const newPath = prev.slice(0, -1);
      // Update URL
      if (newPath.length <= 1) {
        // Remove subgraph param when going back to root
        (navigate as any)({
          search: (old: Record<string, unknown>) => {
            const { subgraph, ...rest } = old as { subgraph?: string };
            return rest;
          },
          replace: false,
        });
      } else {
        (navigate as any)({
          search: (old: Record<string, unknown>) => ({
            ...old,
            subgraph: newPath.join("."),
          }),
          replace: false,
        });
      }
      return newPath;
    });
  }, [navigate]);

  const navigateToPath = useCallback(
    (targetPath: string[]) => {
      setCurrentSubgraphPath(targetPath);
      // Update URL
      if (targetPath.length <= 1) {
        // Remove subgraph param when at root
        (navigate as any)({
          search: (old: Record<string, unknown>) => {
            const { subgraph, ...rest } = old as { subgraph?: string };
            return rest;
          },
          replace: false,
        });
      } else {
        (navigate as any)({
          search: (old: Record<string, unknown>) => ({
            ...old,
            subgraph: targetPath.join("."),
          }),
          replace: false,
        });
      }
    },
    [navigate],
  );

  const canNavigateBack = currentSubgraphPath.length > 1;

  // Sync URL changes (browser back/forward) to state
  useEffect(() => {
    const urlPath = search.subgraph ? search.subgraph.split(".") : ["root"];
    const urlPathString = urlPath.join(".");
    const currentPathString = currentSubgraphPath.join(".");

    // Only update if the URL path is different from current state
    if (urlPathString !== currentPathString) {
      setCurrentSubgraphPath(urlPath);
    }
  }, [search.subgraph, currentSubgraphPath]);

  const value = useMemo(
    () => ({
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      isValid,
      errors,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      setTaskStatusMap,
      undoRedo,

      currentSubgraphPath,
      navigateToSubgraph,
      navigateBack,
      navigateToPath,
      canNavigateBack,
    }),
    [
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      isValid,
      errors,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      setTaskStatusMap,
      undoRedo,

      currentSubgraphPath,
      navigateToSubgraph,
      navigateBack,
      navigateToPath,
      canNavigateBack,
    ],
  );

  return (
    <ComponentSpecContext.Provider value={value}>
      {children}
    </ComponentSpecContext.Provider>
  );
};

export const useComponentSpec = () => {
  return useRequiredContext(ComponentSpecContext);
};
