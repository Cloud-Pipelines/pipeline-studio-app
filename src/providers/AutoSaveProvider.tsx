import equal from "fast-deep-equal";
import { type ReactNode, useEffect, useState } from "react";

import { type AutoSaveStatus, useAutoSave } from "@/hooks/useAutoSave";
import {
  createRequiredContext,
  useRequiredContext,
} from "@/hooks/useRequiredContext";
import {
  EMPTY_GRAPH_COMPONENT_SPEC,
  useComponentSpec,
} from "@/providers/ComponentSpecProvider";
import { AUTOSAVE_DEBOUNCE_TIME_MS } from "@/utils/constants";

interface AutoSaveContextType {
  autoSaveStatus: AutoSaveStatus;
}

const AutoSaveContext =
  createRequiredContext<AutoSaveContextType>("AutosaveProvider");

export const AutoSaveProvider = ({ children }: { children: ReactNode }) => {
  const { componentSpec, saveComponentSpec, isLoading } = useComponentSpec();

  const [isEmptySpec, setIsEmptySpec] = useState(
    equal(componentSpec, EMPTY_GRAPH_COMPONENT_SPEC),
  );

  const shouldAutoSave =
    !isLoading && componentSpec && !!componentSpec.name && !isEmptySpec;

  useEffect(() => {
    setIsEmptySpec(equal(componentSpec, EMPTY_GRAPH_COMPONENT_SPEC));
  }, [componentSpec]);

  const autoSaveStatus = useAutoSave(
    async (spec) => {
      if (spec.name) {
        saveComponentSpec(spec.name);
      }
    },
    componentSpec,
    AUTOSAVE_DEBOUNCE_TIME_MS,
    shouldAutoSave,
  );

  const value = { autoSaveStatus };

  return (
    <AutoSaveContext.Provider value={value}>
      {children}
    </AutoSaveContext.Provider>
  );
};

export const useAutoSaveStatus = () => {
  return useRequiredContext(AutoSaveContext);
};
