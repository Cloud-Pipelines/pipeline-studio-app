import { DndContext } from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "@xyflow/react";

import type { GetGraphExecutionStateResponse } from "@/api/types.gen";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/router";
import { API_URL } from "@/utils/constants";

import GraphComponentSpecFlow from "../../components/Editor/ReactFlow/FlowGraph/FlowGraph";
import type { ComponentSpec } from "../../componentSpec";

const GRID_SIZE = 10;

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
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/executions/${id}/state`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch execution state: ${response.statusText}`,
          );
        }
        return response.json();
      },
      refetchInterval: 5000,
      refetchIntervalInBackground: false,
    });

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

  const componentSpecWithStatus = (): ComponentSpec | undefined => {
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
    const enhancedComponentSpec = {
      ...componentSpec,
      implementation: {
        ...componentSpec.implementation,
        graph: {
          ...componentSpec.implementation.graph,
          tasks: tasksWithStatus,
        },
      },
    };

    return enhancedComponentSpec;
  };

  if (detailsLoading || stateLoading) {
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

  const newComponentSpec = componentSpecWithStatus();

  if (!newComponentSpec) {
    return (
      <div className="flex items-center justify-center h-full">
        No pipeline data available
      </div>
    );
  }

  return (
    <ComponentSpecProvider spec={newComponentSpec}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <div className="reactflow-wrapper h-full w-full">
              <GraphComponentSpecFlow
                snapToGrid={true}
                snapGrid={[GRID_SIZE, GRID_SIZE]}
                nodesDraggable={false}
                fitView
                readOnly
              >
                <MiniMap />
                <Controls />
                <Background gap={GRID_SIZE} />
              </GraphComponentSpecFlow>
            </div>
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

export default PipelineRun;
