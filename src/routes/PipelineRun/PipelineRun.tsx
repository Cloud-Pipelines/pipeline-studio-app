import { DndContext } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import { fetchExecutionState } from "@/services/executionService";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRun = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const {
    componentSpec,
    detailsData,
    isLoading: detailsLoading,
  } = useLoadComponentSpecAndDetailsFromId(id);

  const { data: stateData, isLoading: stateLoading } =
    useQuery<GetGraphExecutionStateResponse>({
      queryKey: ["run_state", id],
      queryFn: () => fetchExecutionState(id),
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
    });

  if (detailsLoading || stateLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading run details...
      </div>
    );
  }

  if (!componentSpec || !detailsData || !stateData) {
    return (
      <div className="flex items-center justify-center h-full">
        No pipeline data available
      </div>
    );
  }

  const taskStatusMap = buildTaskStatusMap(detailsData, stateData);
  const newComponentSpec = addStatusToComponentSpec(
    componentSpec,
    taskStatusMap,
    detailsData,
  );

  return (
    <ComponentSpecProvider spec={newComponentSpec}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <PipelineRunPage />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

export default PipelineRun;

const buildTaskStatusMap = (
  detailsData: GetExecutionInfoResponse,
  stateData: GetGraphExecutionStateResponse,
) => {
  const taskStatusMap = new Map();

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
        }
      },
    );
  }

  return taskStatusMap;
};

const addStatusToComponentSpec = (
  componentSpec: ComponentSpec,
  taskStatusMap: Map<string, string>,
  detailsData: GetExecutionInfoResponse,
): ComponentSpec => {
  if (
    !componentSpec ||
    !("graph" in componentSpec.implementation) ||
    taskStatusMap.size === 0
  ) {
    return componentSpec;
  }

  const tasksWithStatus = Object.fromEntries(
    Object.entries(componentSpec.implementation.graph.tasks).map(
      ([taskId, taskSpec]) => {
        const status = taskStatusMap.get(taskId);
        const executionId = detailsData?.child_task_execution_ids?.[taskId];
        const enhancedTaskSpec = {
          ...taskSpec,
          annotations: {
            ...taskSpec.annotations,
            status: status,
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
        tasks: tasksWithStatus,
      },
    },
  };
};
