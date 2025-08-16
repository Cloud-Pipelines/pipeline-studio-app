import { useReactFlow } from "@xyflow/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { deselectAllNodes } from "@/utils/flowUtils";

import {
  createRequiredContext,
  useRequiredContext,
} from "../hooks/useRequiredContext";

// Readonly context for content
type ContextPanelContentType = {
  content: ReactNode;
};

// Modify context for actions
type ContextPanelActionsType = {
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
};

const ContextPanelContentContext =
  createRequiredContext<ContextPanelContentType>("ContextPanelContentProvider");

const ContextPanelActionsContext =
  createRequiredContext<ContextPanelActionsType>("ContextPanelActionsProvider");

const EMPTY_STATE = (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">Select an element to see details</p>
  </div>
);

export const ContextPanelProvider = ({
  defaultContent = EMPTY_STATE,
  children,
}: {
  defaultContent?: ReactNode;
  children: ReactNode;
}) => {
  const { setNodes } = useReactFlow();
  const defaultContentRef = useRef<ReactNode>(defaultContent);
  const [content, setContentState] = useState<ReactNode>(defaultContent);

  const setContent = useCallback((content: ReactNode) => {
    setContentState(content);
  }, []);

  const clearContent = useCallback(() => {
    setContentState(defaultContentRef.current);
  }, []);

  useEffect(() => {
    defaultContentRef.current = defaultContent;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearContent();
        setNodes(deselectAllNodes);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [defaultContent, clearContent, setNodes]);

  const contentValue = useMemo(() => ({ content }), [content]);

  const actionsValue = useMemo(
    () => ({ setContent, clearContent }),
    [setContent, clearContent],
  );

  return (
    <ContextPanelContentContext.Provider value={contentValue}>
      <ContextPanelActionsContext.Provider value={actionsValue}>
        {children}
      </ContextPanelActionsContext.Provider>
    </ContextPanelContentContext.Provider>
  );
};

export const useContextPanelContent = () => {
  return useRequiredContext(ContextPanelContentContext);
};

export const useContextPanelActions = () => {
  return useRequiredContext(ContextPanelActionsContext);
};
