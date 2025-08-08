import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAutoSave } from "@/hooks/useAutoSave";
import { type UndoRedo, useUndoRedo } from "@/hooks/useUndoRedo";
import { loadPipelineByName } from "@/services/pipelineService";
import {
  AUTOSAVE_DEBOUNCE_TIME_MS,
  USER_PIPELINES_LIST_NAME,
} from "@/utils/constants";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

import {
  createRequiredContext,
  useRequiredContext,
} from "../hooks/useRequiredContext";
import type {
  ComponentSpec,
  GraphImplementation,
  GraphSpec,
} from "../utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  componentSpecToYaml,
  writeComponentToFileListFromText,
} from "../utils/componentStore";

export const EMPTY_GRAPH_COMPONENT_SPEC: ComponentSpec = {
  implementation: {
    graph: {
      tasks: {},
    },
  },
};

interface ComponentSpecContextType {
  componentSpec: ComponentSpec;
  setComponentSpec: (spec: ComponentSpec) => void;
  clearComponentSpec: () => void;
  graphSpec: GraphSpec;
  isLoading: boolean;
  refetch: () => void;
  updateGraphSpec: (newGraphSpec: GraphSpec) => void;
  saveComponentSpec: (name: string) => Promise<void>;
  taskStatusMap: Map<string, string>;
  setTaskStatusMap: (taskStatusMap: Map<string, string>) => void;
  undoRedo: UndoRedo;
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
  const [componentSpec, setComponentSpec] = useState<ComponentSpec>(
    spec ?? EMPTY_GRAPH_COMPONENT_SPEC,
  );

  const [taskStatusMap, setTaskStatusMap] = useState<Map<string, string>>(
    new Map(),
  );

  const [isLoading, setIsLoading] = useState(!!spec);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const clearComponentSpec = useCallback(() => {
    setComponentSpec(EMPTY_GRAPH_COMPONENT_SPEC);
    setTaskStatusMap(new Map());
    setIsLoading(false);
    setHasInitiallyLoaded(false);
  }, []);

  const graphSpec = useMemo(() => {
    if (
      "graph" in componentSpec.implementation &&
      componentSpec.implementation.graph
    ) {
      return componentSpec.implementation.graph;
    }

    return (EMPTY_GRAPH_COMPONENT_SPEC.implementation as GraphImplementation)
      .graph;
  }, [componentSpec]);

  const undoRedo = useUndoRedo(componentSpec, setComponentSpec);

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

  const updateGraphSpec = useCallback((newGraphSpec: GraphSpec) => {
    setComponentSpec((prevSpec) => ({
      ...prevSpec,
      implementation: {
        ...prevSpec.implementation,
        graph: newGraphSpec,
      },
    }));
  }, []);

  const shouldAutoSave =
    !isLoading && !readOnly && !!componentSpec.name && hasInitiallyLoaded;

  useAutoSave(
    (spec) => {
      if (spec.name) {
        saveComponentSpec(spec.name);
      }
    },
    componentSpec,
    AUTOSAVE_DEBOUNCE_TIME_MS,
    shouldAutoSave,
  );

  useEffect(() => {
    if (spec) {
      setIsLoading(true);
      setComponentSpec(spec);
      undoRedo.clearHistory();
      setIsLoading(false);

      // When the provider is loaded with a spec the value goes from null -> empty_graph_spec -> full_spec.
      // Due to this the update from empty_graph_spec to full_spec get detected as a change by the autosaver, triggering an autosave on load.
      // This timeout avoids that by delaying the initial load completion to allow state updates to settle.
      // This is a temporary workaround and the deeper issue should be investigated later.
      setTimeout(() => {
        setHasInitiallyLoaded(true);
      }, AUTOSAVE_DEBOUNCE_TIME_MS);
    }
  }, [spec]);

  const value = useMemo(
    () => ({
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      setTaskStatusMap,
      undoRedo,
    }),
    [
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      setTaskStatusMap,
      undoRedo,
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
