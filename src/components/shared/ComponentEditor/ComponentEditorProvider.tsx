import { type ReactNode, useState } from "react";

import {
  createRequiredContext,
  useRequiredContext,
} from "@/hooks/useRequiredContext";

import { ComponentEditorDialog } from "./ComponentEditorDialog";
import type { SupportedTemplate } from "./types";

interface ComponentEditorOptions {
  text?: string;
  templateName?: SupportedTemplate;
}

interface ComponentEditorContextValue {
  openComponentEditor: (options: ComponentEditorOptions) => void;
}

const ComponentEditorContext =
  createRequiredContext<ComponentEditorContextValue>("ComponentEditorContext");

export function ComponentEditorProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ComponentEditorOptions | null>(null);

  const openComponentEditor = (nextOptions: ComponentEditorOptions) => {
    setOptions(nextOptions);
  };

  return (
    <ComponentEditorContext value={{ openComponentEditor }}>
      {children}
      {options && (
        <ComponentEditorDialog
          text={options.text}
          templateName={options.templateName}
          onClose={() => setOptions(null)}
        />
      )}
    </ComponentEditorContext>
  );
}

export function useComponentEditor() {
  return useRequiredContext(ComponentEditorContext);
}
