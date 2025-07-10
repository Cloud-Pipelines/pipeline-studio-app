import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAutoSave } from "@/hooks/useAutoSave";
import { useUndoRedo } from "@/hooks/useUndoRedo";
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
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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

  // Initialize undo/redo functionality
  const {
    saveVersion,
    undo: undoAction,
    redo: redoAction,
    canUndo,
    canRedo,
  } = useUndoRedo(50);

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

      const specWithName = { ...componentSpec, name };

      const componentText = componentSpecToYaml(specWithName);
      await writeComponentToFileListFromText(
        USER_PIPELINES_LIST_NAME,
        name,
        componentText,
      );

      setOriginalComponentSpec(specWithName);
      setComponentSpec(specWithName);
    },
    [componentSpec],
  );

  useAutoSave(
    (spec) => {
      if (spec.name && isDirty) {
        saveComponentSpec(spec.name);
      }
    },
    componentSpec,
    isDirty && !!componentSpec.name,
  );

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    const previousVersion = undoAction();
    if (previousVersion) {
      setComponentSpec(previousVersion);
      setOriginalComponentSpec(previousVersion);
      setIsDirty(false);
    }
  }, [undoAction]);

  const handleRedo = useCallback(() => {
    const nextVersion = redoAction();
    if (nextVersion) {
      setComponentSpec(nextVersion);
      setOriginalComponentSpec(nextVersion);
      setIsDirty(false);
    }
  }, [redoAction]);

  const updateGraphSpec = useCallback(
    (newGraphSpec: GraphSpec) => {
      handleSetComponentSpec({
        ...componentSpec,
        implementation: {
          ...componentSpec.implementation,
          graph: newGraphSpec,
        },
      });
    },
    [componentSpec, saveVersion],
  );

  useEffect(() => {
    if (componentSpec !== originalComponentSpec) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [componentSpec, originalComponentSpec, setIsDirty]);

  useEffect(() => {
    const initialSpec = spec ?? EMPTY_GRAPH_COMPONENT_SPEC;
    handleSetComponentSpec(initialSpec);
    setOriginalComponentSpec(initialSpec);
    setIsDirty(false);
    setIsLoading(false);
  }, [spec]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          // Cmd/Ctrl + Shift + Z = Redo
          handleRedo();
        } else {
          // Cmd/Ctrl + Z = Undo
          handleUndo();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleSetComponentSpec = (spec: ComponentSpec) => {
    // const isDifferent = JSON.stringify(spec) !== JSON.stringify(componentSpec);
    const isDefault = JSON.stringify(componentSpec) === JSON.stringify(EMPTY_GRAPH_COMPONENT_SPEC);

    const shouldSaveVersion = !isDefault;

    if (shouldSaveVersion) {
      saveVersion(componentSpec);
    }

    setComponentSpec(spec);
  };

  const value = useMemo(
    () => ({
      componentSpec,
      setComponentSpec: handleSetComponentSpec,
      isDirty,
      graphSpec,
      isLoading,
      refetch,
      updateGraphSpec,
      saveComponentSpec,
      taskStatusMap,
      setTaskStatusMap,
      undo: handleUndo,
      redo: handleRedo,
      canUndo: canUndo(),
      canRedo: canRedo(),
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
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
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
