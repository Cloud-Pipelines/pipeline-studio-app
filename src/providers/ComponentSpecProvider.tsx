import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import loadPipelineByName from "@/utils/loadPipelineByName";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

import type {
  ComponentSpec,
  GraphImplementation,
  GraphSpec,
} from "../componentSpec";
import { type ComponentReferenceWithSpec } from "../componentStore";

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
    spec ?? EMPTY_GRAPH_COMPONENT_SPEC
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

  const loadPipeline = useCallback(async () => {
    if (componentSpec) {
      setComponentSpec(componentSpec);
      setOriginalComponentSpec(componentSpec);
    }

    if (!experimentName) return;

    const result = await loadPipelineByName(experimentName);

    const preparedComponentRef = await prepareComponentRefForEditor(
      result.experiment?.componentRef as ComponentReferenceWithSpec
    );

    setComponentSpec(preparedComponentRef);
    setOriginalComponentSpec(preparedComponentRef);
    setIsLoading(false);
  }, [experimentName]);

  const refetch = useCallback(() => {
    loadPipeline();
  }, [loadPipeline]);

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
      "useComponentSpec must be used within a ComponentSpecProvider"
    );
  }
  return context;
};
