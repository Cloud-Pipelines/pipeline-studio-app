import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { GetExecutionInfoResponse } from "@/api/types.gen";
import type { ComponentSpec } from "@/componentSpec";
import type { ComponentReferenceWithSpec } from "@/componentStore";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

const API_URL = import.meta.env.VITE_BACKEND_API_URL ?? "";

export const useLoadComponentSpecAndDetailsFromId = (id: string) => {
  if (!id) {
    return {
      componentSpec: undefined,
      detailsData: undefined,
      isLoading: false,
    };
  }

  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();
  const { data: detailsData, isLoading: detailsLoading } =
    useQuery<GetExecutionInfoResponse>({
      queryKey: ["run_details", id],
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/executions/${id}/details`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch execution details: ${response.statusText}`,
          );
        }
        return response.json();
      },
    });

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

    loadPipeline();
  }, [detailsData, detailsLoading]);

  return { componentSpec, detailsData, isLoading: detailsLoading };
};
