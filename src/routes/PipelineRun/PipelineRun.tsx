import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { faviconManager } from "@/favicon";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import {
  countTaskStatuses,
  getRunStatus,
  STATUS,
  useFetchExecutionInfo,
  useFetchPipelineRun,
} from "@/services/executionService";
import { getBackendStatusString } from "@/utils/backend";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRun = () => {
  const { setComponentSpec, clearComponentSpec, componentSpec } =
    useComponentSpec();
  const { backendUrl, configured, available, ready } = useBackend();
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const [rootExecutionId, setRootExecutionId] = useState<string>(id);
  const [triedAsRunId, setTriedAsRunId] = useState<boolean>(false);

  // First try to fetch as root_execution_id
  const {
    data: executionData,
    isLoading: isExecutionLoading,
    error: executionError,
    refetch: refetchExecution,
    enabled,
  } = useFetchExecutionInfo(
    rootExecutionId,
    false, // poll
    !triedAsRunId, // enabled - disable if we've already tried as run_id
  );

  // If fetching as root_execution_id fails, try as run_id
  const shouldFetchAsRunId = !!executionError && !triedAsRunId && enabled;
  const {
    data: pipelineRunData,
    isLoading: isPipelineRunLoading,
    error: pipelineRunError,
  } = useFetchPipelineRun(
    id,
    shouldFetchAsRunId, // enabled
  );

  // Update rootExecutionId when we get pipeline run data
  useEffect(() => {
    if (
      pipelineRunData?.root_execution_id &&
      pipelineRunData.root_execution_id !== rootExecutionId
    ) {
      setRootExecutionId(pipelineRunData.root_execution_id);
      setTriedAsRunId(true);
    }
  }, [pipelineRunData, rootExecutionId]);

  // Determine which data and loading state to use
  const isLoading =
    isExecutionLoading || (shouldFetchAsRunId && isPipelineRunLoading);
  const error = triedAsRunId
    ? executionError
    : executionError && pipelineRunError;
  const data = executionData;
  const refetch = refetchExecution;

  const { details, state } = data;

  // Update favicon based on pipeline status
  useEffect(() => {
    if (!details || !state) {
      faviconManager.reset();
      return;
    }

    const statusCounts = countTaskStatuses(details, state);
    const pipelineStatus = getRunStatus(statusCounts);
    const iconStatus = mapRunStatusToFavicon(pipelineStatus);
    faviconManager.updateFavicon(iconStatus);

    return () => {
      faviconManager.reset();
    };
  }, [details, state]);

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

  if (isLoading || !ready) {
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

  if (!available) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <InfoBox title="Backend not available" variant="error">
          The configured backend is not available.
        </InfoBox>
      </div>
    );
  }

  if (!componentSpec) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <InfoBox title="Error loading pipeline run" variant="error">
          No pipeline data available.
        </InfoBox>
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
          <PipelineRunContent
            rootExecutionId={rootExecutionId}
            details={details}
            state={state}
          />
        </ReactFlowProvider>
      </DndContext>
    </div>
  );
};

const PipelineRunContent = ({
  rootExecutionId,
  details,
  state,
}: {
  rootExecutionId: string;
  details?: GetExecutionInfoResponse;
  state?: GetGraphExecutionStateResponse;
}) => {
  const { setTaskStatusMap } = useComponentSpec();

  useEffect(() => {
    const taskStatusMap = buildTaskStatusMap(details, state);
    setTaskStatusMap(taskStatusMap);
  }, [details, state, setTaskStatusMap]);

  return <PipelineRunPage rootExecutionId={rootExecutionId} />;
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

export const mapRunStatusToFavicon = (
  runStatus: string,
): "success" | "failed" | "loading" | "paused" | "default" => {
  switch (runStatus) {
    case STATUS.SUCCEEDED:
      return "success";
    case STATUS.FAILED:
      return "failed";
    case STATUS.RUNNING:
      return "loading";
    case STATUS.WAITING:
      return "paused";
    case STATUS.CANCELLED:
      return "paused";
    case STATUS.UNKNOWN:
    default:
      return "default";
  }
};
