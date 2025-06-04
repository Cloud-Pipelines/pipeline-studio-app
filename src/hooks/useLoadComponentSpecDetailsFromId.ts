import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { GetExecutionInfoResponse } from "@/api/types.gen";
import { RUNS_BASE_PATH } from "@/routes/router";
import { loadPipelineByName } from "@/services/pipelineService";
import type { ComponentSpec } from "@/utils/componentSpec";
import type { ComponentReferenceWithSpec } from "@/utils/componentStore";
import { API_URL } from "@/utils/constants";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

const getIdOrTitleFromPath = (
  pathname: string,
): {
  idOrTitle?: string;
  enableApi: boolean;
} => {
  const isRunPath = pathname.includes(RUNS_BASE_PATH);

  const lastPathSegment = pathname.split("/").pop() || "";
  return {
    idOrTitle: decodeURIComponent(lastPathSegment),
    enableApi: isRunPath,
  };
};

export const useLoadComponentSpecAndDetailsFromId = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { idOrTitle, enableApi } = getIdOrTitleFromPath(pathname);
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);

  // Query for run details if we have an ID
  const { data: detailsData, isLoading: detailsLoading } =
    useQuery<GetExecutionInfoResponse>({
      queryKey: ["run_details", idOrTitle],
      queryFn: async () => {
        const response = await fetch(
          `${API_URL}/api/executions/${idOrTitle}/details`,
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch execution details: ${response.statusText}`,
          );
        }
        return response.json();
      },
      enabled: enableApi,
    });

  // Load pipeline from local storage if we're in the editor
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
  }, [idOrTitle, detailsLoading]);

  // Load pipeline from run details if we have them
  useEffect(() => {
    const loadPipeline = async () => {
      if (
        detailsLoading ||
        !detailsData?.task_spec?.componentRef?.spec?.implementation
      ) {
        return;
      }

      try {
        const componentText = JSON.stringify(
          detailsData.task_spec.componentRef.spec,
        );

        const componentRef: ComponentReferenceWithSpec = {
          name: detailsData.task_spec.componentRef.name || undefined,
          digest:
            detailsData.task_spec.componentRef.spec?.metadata?.annotations
              ?.digest || "unknown",
          tag: detailsData.task_spec.componentRef.tag || undefined,
          url: detailsData.task_spec.componentRef.url || undefined,
          spec: {
            ...detailsData.task_spec.componentRef.spec,
            implementation:
              detailsData.task_spec.componentRef.spec.implementation,
          } as ComponentSpec,
          text: componentText,
        };

        // Prepare the component for the editor
        const preparedComponentRef =
          await prepareComponentRefForEditor(componentRef);
        setComponentSpec(preparedComponentRef);
      } catch (error) {
        console.error("Error preparing component for editor:", error);
      }
    };

    if (detailsData) {
      loadPipeline();
    }
  }, [detailsData, detailsLoading]);

  return {
    componentSpec,
    detailsData,
    isLoading: detailsLoading || isLoadingPipeline,
  };
};
