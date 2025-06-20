import { createContext, type ReactNode, useContext, useState } from "react";

type ContextPanelContextType = {
  content: ReactNode;
  key: string | null;
  setContent: (content: ReactNode, key: string) => void;
  clearContent: (key: string) => void;
};

const ContextPanelContext = createContext<ContextPanelContextType | undefined>(
  undefined,
);

const EMPTY_STATE = (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500">Select an element to see details</p>
  </div>
);

const DEFAULT_KEY = "context_panel_default";

export const ContextPanelProvider = ({
  defaultContent = EMPTY_STATE,
  children,
}: {
  defaultContent?: ReactNode;
  children: ReactNode;
}) => {
  const [content, setContentState] = useState<ReactNode>(defaultContent);
  const [key, setKey] = useState<string | null>(DEFAULT_KEY);

  const setContent = (content: ReactNode, key: string) => {
    setContentState(content);
    setKey(key);
  };

  const clearContent = (keyToClear: string) => {
    if (key === keyToClear) {
      setContentState(defaultContent);
      setKey(DEFAULT_KEY);
    }
  };

  return (
    <ContextPanelContext.Provider
      value={{ content, key, setContent, clearContent }}
    >
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
