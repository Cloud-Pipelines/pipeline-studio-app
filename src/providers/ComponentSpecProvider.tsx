import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAutoSave } from "@/hooks/useAutoSave";
import { loadPipelineByName } from "@/services/pipelineService";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";
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
  graphSpec: GraphSpec;
  isLoading: boolean;
  refetch: () => void;
  updateGraphSpec: (newGraphSpec: GraphSpec) => void;
  saveComponentSpec: (name: string) => Promise<void>;
  taskStatusMap: Map<string, string>;
  setTaskStatusMap: (taskStatusMap: Map<string, string>) => void;
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
      }

      const name = newName ?? componentSpec.name;
      if (!name) return;

      const result = await loadPipelineByName(name);
      if (!result.experiment) return;

      const preparedComponentRef = await prepareComponentRefForEditor(
        result.experiment.componentRef as ComponentReferenceWithSpec,
      );

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
    [componentSpec],
  );

  useAutoSave((spec) => {
    if (spec.name) {
      saveComponentSpec(spec.name);
    }
  }, componentSpec);

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
    setComponentSpec(spec ?? EMPTY_GRAPH_COMPONENT_SPEC);
    setIsLoading(false);
  }, [spec]);

  const value = useMemo(
    () => ({
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      refetch,
      setComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
      setTaskStatusMap,
    }),
    [
      componentSpec,
      graphSpec,
      taskStatusMap,
      isLoading,
      refetch,
      setComponentSpec,
      saveComponentSpec,
      updateGraphSpec,
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
  return useRequiredContext(ComponentSpecContext);
};
