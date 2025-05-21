import { DndContext } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";

import type {
  GetApiPipelineRunsIdGetResponse,
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import {
  ComponentSpecProvider,
  useComponentSpec,
} from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import { fetchExecutionState } from "@/services/executionService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { API_URL } from "@/utils/constants";

const PipelineRunHtml = ({
  detailsData,
  executionId,
  runDetails,
}: {
  detailsData: GetExecutionInfoResponse | undefined;
  executionId: string;
  runDetails?: GetApiPipelineRunsIdGetResponse;
}) => {
  const { setTaskStatusMap } = useComponentSpec();

  const { data: stateData } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["run_state", executionId],
    queryFn: () => fetchExecutionState(executionId),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    staleTime: 1000,
  });

  console.log("runDetails", runDetails);

  useEffect(() => {
    const taskStatusMap = buildTaskStatusMap(detailsData, stateData);
    setTaskStatusMap(taskStatusMap);
  }, [stateData]);

  return <PipelineRunPage />;
};

const PipelineRun = () => {
  const { run_id, execution_id } =
    runDetailRoute.useParams() as RunDetailParams;
  const {
    componentSpec,
    detailsData,
    isLoading: detailsLoading,
  } = useLoadComponentSpecAndDetailsFromId(execution_id);

  const { data: runDetails, isLoading: isRunDetailsLoading } = useQuery<GetApiPipelineRunsIdGetResponse>({
    queryKey: ["run", run_id],
    refetchOnWindowFocus: false,
    enabled: !!run_id,
    queryFn: async () => {
      const url = `${API_URL}/api/pipeline_runs/${run_id}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch pipeline runs: ${response.statusText}`,
        );
      }

      return response.json();
    },
  });

  if (detailsLoading || isRunDetailsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading run details...
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
              executionId={execution_id}
              runDetails={runDetails}
            />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

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

export default PipelineRun;
