import { useReactFlow } from "@xyflow/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type ContextPanelContextType = {
  content: ReactNode;
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
};

const ContextPanelContext = createContext<ContextPanelContextType | undefined>(
  undefined,
);

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
  const [content, setContentState] = useState<ReactNode>(defaultContent);

  const setContent = (content: ReactNode) => {
    setContentState(content);
  };

  const clearContent = () => {
    setContentState(defaultContent);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearContent();
        setNodes((prevNodes) =>
          prevNodes.map((node) => ({ ...node, selected: false })),
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [defaultContent]);

  return (
    <ContextPanelContext.Provider value={{ content, setContent, clearContent }}>
      {children}
    </ContextPanelContext.Provider>
  );
};

export const useContextPanel = () => {
  const ctx = useContext(ContextPanelContext);
  if (!ctx)
    throw new Error(
      "useContextPanel must be used within a ContextPanelProvider",
    );
  return ctx;
};
