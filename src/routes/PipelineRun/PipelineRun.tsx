import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";

import type { GetExecutionInfoResponse } from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import { useFetchExecutionInfo } from "@/services/executionService";
import { getBackendStatusString } from "@/utils/backend";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRun = () => {
  const { setComponentSpec, clearComponentSpec, componentSpec } =
    useComponentSpec();
  const { backendUrl, configured, available } = useBackend();
  const { id: rootExecutionId } = runDetailRoute.useParams() as RunDetailParams;

  const { data, isLoading, error, refetch } = useFetchExecutionInfo(
    rootExecutionId,
    backendUrl,
    false,
  );

  const { details } = data;

  useEffect(() => {
    if (details?.task_spec.componentRef.spec) {
      const componentSpecWithExecutionIds = addExecutionIdToComponent(
        details.task_spec.componentRef.spec as ComponentSpec,
        details,
      );

      setComponentSpec(componentSpecWithExecutionIds);
    }
    return () => {
      clearComponentSpec();
    };
  }, [details, setComponentSpec, clearComponentSpec]);

  useDocumentTitle({
    "/runs/$id": (params) =>
      `Oasis - ${componentSpec?.name || ""} - ${params.id}`,
  });

  useEffect(() => {
    refetch();
  }, [backendUrl, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <Spinner /> Loading Pipeline Run...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <InfoBox title="Backend not configured" variant="warning">
          Configure a backend to view this pipeline run.
        </InfoBox>
      </div>
    );
  }

  if (!componentSpec) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        No pipeline data available
      </div>
    );
  }

  if (error) {
    const backendStatusString = getBackendStatusString(configured, available);
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <InfoBox title="Error loading pipeline run" variant="error">
          <div className="mb-2">{error.message}</div>
          <div className="text-black italic">{backendStatusString}</div>
        </InfoBox>
      </div>
    );
  }

  return (
    <div className="dndflow">
      <DndContext>
        <ReactFlowProvider>
          <PipelineRunPage rootExecutionId={rootExecutionId} />
        </ReactFlowProvider>
      </DndContext>
    </div>
  );
};

export default PipelineRun;

const addExecutionIdToComponent = (
  componentSpec: ComponentSpec,
  detailsData?: GetExecutionInfoResponse,
): ComponentSpec => {
  if (
    !componentSpec ||
    !("graph" in componentSpec.implementation) ||
    !detailsData
  ) {
    return componentSpec;
  }

  const tasksWithExecutionId = Object.fromEntries(
    Object.entries(componentSpec.implementation.graph.tasks).map(
      ([taskId, taskSpec]) => {
        const executionId = detailsData?.child_task_execution_ids?.[taskId];
        const enhancedTaskSpec = {
          ...taskSpec,
          annotations: {
            ...taskSpec.annotations,
            executionId: executionId,
          },
        };
        return [taskId, enhancedTaskSpec];
      },
    ),
  );

  return {
    ...componentSpec,
    implementation: {
      ...componentSpec.implementation,
      graph: {
        ...componentSpec.implementation.graph,
        tasks: tasksWithExecutionId,
      },
    },
  };
};
