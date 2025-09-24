import { useEffect, useMemo, useState } from "react";

import { hydrateComponentReference } from "@/services/componentService";
import type { ComponentReference } from "@/utils/componentSpec";

import { generatePreviewTaskNodeData } from "./ComponentEditorDialog";

export const usePreviewTaskNodeData = (componentText: string) => {
  const [componentRef, setComponentRef] = useState<
    ComponentReference | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    hydrateComponentReference({ text: componentText }).then((ref) => {
      if (!cancelled && ref) setComponentRef(ref);
    });
    return () => {
      cancelled = true;
    };
  }, [componentText]);

  return useMemo(() => {
    if (!componentRef) return undefined;

    return generatePreviewTaskNodeData(componentRef);
  }, [componentRef]);
};
