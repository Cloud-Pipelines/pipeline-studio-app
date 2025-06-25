import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { loadPipelineByName } from "@/services/pipelineService";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

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
  isDirty: boolean;
  graphSpec: GraphSpec;
  isLoading: boolean;
  refetch: () => void;
  updateGraphSpec: (newGraphSpec: GraphSpec) => void;
  saveComponentSpec: (name: string) => Promise<void>;
  taskStatusMap: Map<string, string>;
  setTaskStatusMap: (taskStatusMap: Map<string, string>) => void;
}

const ComponentSpecContext = createContext<
  ComponentSpecContextType | undefined
>(undefined);

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
  const [originalComponentSpec, setOriginalComponentSpec] =
    useState<ComponentSpec>(spec ?? EMPTY_GRAPH_COMPONENT_SPEC);

  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadPipeline = useCallback(
    async (newName?: string) => {
      if (componentSpec) {
        setComponentSpec(componentSpec);
        setOriginalComponentSpec(componentSpec);
      }

      const name = newName ?? componentSpec.name;
      if (!name) return;

      const result = await loadPipelineByName(name);
      if (!result.experiment) return;

      const preparedComponentRef = await prepareComponentRefForEditor(
        result.experiment.componentRef as ComponentReferenceWithSpec,
      );

      setComponentSpec(preparedComponentRef);
      setOriginalComponentSpec(preparedComponentRef);
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

      componentSpec.name = name;

      const componentText = componentSpecToYaml(componentSpec);
      await writeComponentToFileListFromText(
        USER_PIPELINES_LIST_NAME,
        name,
        componentText,
      );

      setOriginalComponentSpec(componentSpec);
    },
    [componentSpec],
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

  useEffect(() => {
    if (componentSpec !== originalComponentSpec) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [componentSpec, originalComponentSpec, setIsDirty]);

  useEffect(() => {
    setComponentSpec(spec ?? EMPTY_GRAPH_COMPONENT_SPEC);
    setOriginalComponentSpec(spec ?? EMPTY_GRAPH_COMPONENT_SPEC);
    setIsDirty(false);
    setIsLoading(false);
  }, [spec]);

  const value = useMemo(
    () => ({
      componentSpec,
      setComponentSpec,
      isDirty,
      graphSpec,
      isLoading,
      refetch,
      updateGraphSpec,
      saveComponentSpec,
      taskStatusMap,
      setTaskStatusMap,
    }),
    [
      componentSpec,
      setComponentSpec,
      isDirty,
      graphSpec,
      isLoading,
      refetch,
      updateGraphSpec,
      saveComponentSpec,
      taskStatusMap,
      setTaskStatusMap,
    ],
  );

  return (
    <ComponentSpecContext.Provider value={value}>
      {children}
    </ComponentSpecContext.Provider>
  );
};

export const useComponentSpec = () => {
  const context = useContext(ComponentSpecContext);
  if (!context) {
    throw new Error(
      "useComponentSpec must be used within a ComponentSpecProvider",
    );
  }
  return context;
};
