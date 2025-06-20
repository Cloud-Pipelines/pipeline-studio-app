import { DndContext } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import {
  ComponentSpecProvider,
  useComponentSpec,
} from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import { fetchExecutionState } from "@/services/executionService";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRunHtml = ({
  detailsData,
  id,
}: {
  detailsData: GetExecutionInfoResponse | undefined;
  id: string;
}) => {
  const { setTaskStatusMap } = useComponentSpec();

  const { data: stateData } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["run_state", id],
    queryFn: () => fetchExecutionState(id),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    staleTime: 1000,
  });

  useEffect(() => {
    const taskStatusMap = buildTaskStatusMap(detailsData, stateData);
    setTaskStatusMap(taskStatusMap);
  }, [stateData]);

  return <PipelineRunPage />;
};

const PipelineRun = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const {
    componentSpec,
    detailsData,
    isLoading: detailsLoading,
  } = useLoadComponentSpecAndDetailsFromId();

  useDocumentTitle({
    "/runs/$id": (params) =>
      `Oasis - ${componentSpec?.name || ""} - ${params.id}`,
  });

  if (detailsLoading) {
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
    <ComponentSpecProvider spec={componentSpecWithExecutionIds} runId={id}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <PipelineRunHtml detailsData={detailsData} id={id} />
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
