import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";

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
import type { ComponentSpec, GraphSpec } from "../utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  componentSpecToYaml,
  writeComponentToFileListFromText,
} from "../utils/componentStore";

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
  refetch: () => void;
  updateGraphSpec: (newGraphSpec: GraphSpec) => void;
  saveComponentSpec: (name: string) => Promise<void>;
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

  // This is used to prevent autosaving on initial load
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  // Auto save should happen on the first change without debounce to prevent waiting for two debounces (4000ms)
  const [debounceMultiplier, setDebounceMultiplier] = useState<0 | 1>(0);

  const [isLoading, setIsLoading] = useState(!!spec);

  const undoRedo = useUndoRedo(componentSpec, setComponentSpec);
  const undoRedoRef = useRef(undoRedo);
  undoRedoRef.current = undoRedo;

  const clearComponentSpec = useCallback(() => {
    setComponentSpec(EMPTY_GRAPH_COMPONENT_SPEC);
    setIsLoading(false);
    undoRedoRef.current.clearHistory();
  }, []);

  const graphSpec = useMemo(() => {
    if (!componentSpec) {
      return EMPTY_GRAPH_SPEC;
    }

    if (
      "graph" in componentSpec.implementation &&
      componentSpec.implementation.graph
    ) {
      return componentSpec.implementation.graph;
    }

    return EMPTY_GRAPH_SPEC;
  }, [componentSpec]);

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
    !isLoading && !readOnly && componentSpec && !!componentSpec.name;

  useAutoSave(
    async (spec) => {
      if (isInitialLoad) {
        setIsInitialLoad(false);
        setDebounceMultiplier(1);
        return;
      }

      if (spec.name) {
        saveComponentSpec(spec.name);
      }
    },
    componentSpec,
    AUTOSAVE_DEBOUNCE_TIME_MS * debounceMultiplier,
    shouldAutoSave,
  );

  const value = useMemo(
    () => ({
      componentSpec,
      graphSpec,
      isLoading,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      undoRedo,
    }),
    [
      componentSpec,
      graphSpec,
      isLoading,
      refetch,
      setComponentSpec,
      clearComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
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
