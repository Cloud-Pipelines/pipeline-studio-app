import { DndContext } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { useBackend } from "@/providers/BackendProvider";
import {
  ComponentSpecProvider,
  useComponentSpec,
} from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import { fetchExecutionState } from "@/services/executionService";
import { getBackendStatusString } from "@/utils/backend";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRunHtml = ({
  detailsData,
  rootExecutionId,
}: {
  detailsData: GetExecutionInfoResponse | undefined;
  rootExecutionId: string;
}) => {
  const { backendUrl, configured, available } = useBackend();
  const { setTaskStatusMap } = useComponentSpec();

  const {
    data: stateData,
    isLoading,
    refetch,
    error,
  } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["run_state", rootExecutionId],
    queryFn: () => fetchExecutionState(rootExecutionId, backendUrl),
    refetchInterval: available ? 5000 : false,
    refetchIntervalInBackground: false,
    staleTime: 1000,
  });

  useEffect(() => {
    refetch();
  }, [backendUrl, refetch]);

  useEffect(() => {
    const taskStatusMap = buildTaskStatusMap(detailsData, stateData);
    setTaskStatusMap(taskStatusMap);
  }, [stateData]);

  if (!configured) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <InfoBox title="Backend not configured" variant="warning">
          Configure a backend to view this pipeline run.
        </InfoBox>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <Spinner /> Loading Pipeline Run...
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

  return <PipelineRunPage rootExecutionId={rootExecutionId} />;
};

const PipelineRun = () => {
  const { backendUrl, configured, available } = useBackend();

  const { id: rootExecutionId } = runDetailRoute.useParams() as RunDetailParams;
  const {
    componentSpec,
    detailsData,
    isLoading: detailsLoading,
    error,
  } = useLoadComponentSpecAndDetailsFromId(backendUrl);

  useDocumentTitle({
    "/runs/$id": (params) =>
      `Oasis - ${componentSpec?.name || ""} - ${params.id}`,
  });

  if (detailsLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <Spinner /> Loading Pipeline Run...
      </div>
    );
  }

  if (!componentSpec) {
    return (
      <div className="flex items-center justify-center h-full">
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

  const componentSpecWithExecutionIds = addExecutionIdToComponent(
    componentSpec,
    detailsData,
  );

  return (
    <ComponentSpecProvider spec={componentSpecWithExecutionIds}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <PipelineRunHtml
              detailsData={detailsData}
              rootExecutionId={rootExecutionId}
            />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

export default PipelineRun;

const buildTaskStatusMap = (
  detailsData?: GetExecutionInfoResponse,
  stateData?: GetGraphExecutionStateResponse,
) => {
  const taskStatusMap = new Map();
  if (!detailsData) {
    return taskStatusMap;
  }

  // If no state data is available, set all tasks to WAITING_FOR_UPSTREAM
  if (!stateData && detailsData?.child_task_execution_ids) {
    Object.keys(detailsData.child_task_execution_ids).forEach((taskId) => {
      taskStatusMap.set(taskId, "WAITING_FOR_UPSTREAM");
    });
    return taskStatusMap;
  }

  if (
    detailsData?.child_task_execution_ids &&
    stateData?.child_execution_status_stats
  ) {
    Object.entries(detailsData.child_task_execution_ids).forEach(
      ([taskId, executionId]) => {
        const executionIdStr = String(executionId);
        const statusStats =
          stateData.child_execution_status_stats[executionIdStr];

        if (statusStats) {
          const status = Object.keys(statusStats)[0];
          taskStatusMap.set(taskId, status);
        } else {
          // If this task doesn't have status in state data, mark as WAITING
          taskStatusMap.set(taskId, "WAITING_FOR_UPSTREAM");
        }
      },
    );
  }

  return taskStatusMap;
};

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
