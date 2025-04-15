import React, { createContext, useContext, useEffect, useState } from "react";

import loadPipelineByName from "@/utils/loadPipelineByName";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

import type { ComponentSpec } from "../componentSpec";
import { type ComponentReferenceWithSpec } from "../componentStore";

interface ComponentSpecContextType {
  componentSpec: ComponentSpec | undefined;
  setComponentSpec: (spec: ComponentSpec) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
}

const ComponentSpecContext = createContext<
  ComponentSpecContextType | undefined
>(undefined);

export const ComponentSpecProvider: React.FC<{
  experimentName: string;
  children: React.ReactNode;
}> = ({ experimentName, children }) => {
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const loadPipeline = async () => {
      if (!experimentName) return;

      const result = await loadPipelineByName(experimentName);

      const preparedComponentRef = await prepareComponentRefForEditor(
        result.experiment?.componentRef as ComponentReferenceWithSpec
      );

      setComponentSpec(preparedComponentRef);
    };

    loadPipeline();
  }, [experimentName]);

  return (
    <ComponentSpecContext.Provider
      value={{ componentSpec, setComponentSpec, isDirty, setIsDirty }}
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
