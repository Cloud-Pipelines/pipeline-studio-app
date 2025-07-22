import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { loadPipelineByName } from "@/services/pipelineService";
import type { ComponentSpec } from "@/utils/componentSpec";
import type { ComponentReferenceWithSpec } from "@/utils/componentStore";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";
import { getIdOrTitleFromPath } from "@/utils/URL";

export const useLoadComponentSpecFromId = () => {
  const location = useLocation();

  const pathname = location.pathname;
  const { idOrTitle, enableApi } = getIdOrTitleFromPath(pathname);
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);

  useEffect(() => {
    const loadPipelineFromStorage = async () => {
      if (!idOrTitle) return;

      setIsLoadingPipeline(true);
      try {
        const result = await loadPipelineByName(idOrTitle);
        if (result.experiment?.componentRef?.spec) {
          const preparedComponentRef = await prepareComponentRefForEditor(
            result.experiment.componentRef as ComponentReferenceWithSpec,
          );
          setComponentSpec(preparedComponentRef);
        }
      } catch (error) {
        console.error("Error loading pipeline from storage:", error);
      } finally {
        setIsLoadingPipeline(false);
      }
    };

    loadPipelineFromStorage();
  }, [idOrTitle]);

  return {
    componentSpec,
    isLoading: isLoadingPipeline,
    enableApi,
  };
};
