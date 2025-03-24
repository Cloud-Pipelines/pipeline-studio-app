import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { ComponentSpec } from "@/componentSpec";
import type { ComponentReferenceWithSpec } from "@/componentStore";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

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
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ["run_details", id],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${id}/details`,
      ).then((response) => response.json()),
  });

  useEffect(() => {
    const loadPipeline = async () => {
      if (detailsLoading || !detailsData?.task_spec?.componentRef) {
        return;
      }

      try {
        const componentRef: ComponentReferenceWithSpec = {
          ...detailsData.task_spec.componentRef,
          digest:
            detailsData.task_spec.componentRef.spec?.metadata?.annotations
              ?.digest || "unknown",
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
