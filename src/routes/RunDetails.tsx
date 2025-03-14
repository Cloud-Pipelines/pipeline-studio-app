import { useEffect, useState } from "react";
import {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
} from "@xyflow/react";
import mockFetch from "@/utils/mockAPI";
import { useQuery } from "@tanstack/react-query";
import type { ComponentSpec } from "../componentSpec";
import GraphComponentSpecFlow from "../DragNDrop/GraphComponentSpecFlow";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";
import { type ComponentReferenceWithSpec } from "../componentStore";
import { DndContext } from "@dnd-kit/core";

import { runDetailRoute, type RunDetailParams } from "@/router";

const GRID_SIZE = 10;

const RunDetails = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ["run_details", id],
    queryFn: () =>
      mockFetch(`https://oasis.shopify.io/api/executions/${id}/details`).then(
        (response) => response.json(),
      ),
  });

  const { data: stateData, isLoading: stateLoading } = useQuery({
    queryKey: ["run_state", id],
    queryFn: () =>
      mockFetch(`https://oasis.shopify.io/api/executions/${id}/state`).then(
        (response) => response.json(),
      ),
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

  useEffect(() => {
    const loadPipeline = async () => {
      if (detailsLoading || !detailsData?.task_spec?.componentRef) {
        return;
      }

      try {
        // Create a component reference from the run details
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
          const enhancedTaskSpec = {
            ...taskSpec,
            annotations: {
              ...taskSpec.annotations,
              status: status,
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
    <div className="h-full w-full">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold">
          {detailsData?.task_spec?.componentRef?.spec?.name || "Run Details"}
        </h1>
        <p className="text-gray-500">Run ID: {id}</p>
      </div>

      <div className="h-[calc(100%-80px)]">
        <DndContext>
          <ReactFlowProvider>
            <div className="h-full w-full">
              <GraphComponentSpecFlow
                componentSpec={newComponentSpec}
                setComponentSpec={() => {}}
                snapToGrid={true}
                snapGrid={[GRID_SIZE, GRID_SIZE]}
              >
                <MiniMap />
                <Controls />
                <Background gap={GRID_SIZE} />
              </GraphComponentSpecFlow>
            </div>
          </ReactFlowProvider>
        </DndContext>
      </div>
    </div>
  );
};

export default RunDetails;
