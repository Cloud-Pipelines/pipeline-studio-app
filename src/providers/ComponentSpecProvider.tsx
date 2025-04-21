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
}

const ComponentSpecContext = createContext<
  ComponentSpecContextType | undefined
>(undefined);

export const ComponentSpecProvider = ({
  experimentName,
  spec,
  children,
}: {
  experimentName?: string;
  spec?: ComponentSpec;
  children: ReactNode;
}) => {
  const [componentSpec, setComponentSpec] = useState<ComponentSpec>(
    spec ?? EMPTY_GRAPH_COMPONENT_SPEC,
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

      const name = newName ?? experimentName;
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
    [experimentName],
  );

  const refetch = useCallback(() => {
    loadPipeline();
  }, [loadPipeline]);

  const saveComponentSpec = useCallback(
    async (name: string) => {
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
    loadPipeline();
  }, [loadPipeline]);

  useEffect(() => {
    if (componentSpec !== originalComponentSpec) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [componentSpec, originalComponentSpec, setIsDirty]);

  return (
    <ComponentSpecContext.Provider
      value={{
        componentSpec,
        setComponentSpec,
        isDirty,
        graphSpec,
        isLoading,
        refetch,
        updateGraphSpec,
        saveComponentSpec,
      }}
    >
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
