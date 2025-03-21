import { useEffect, useState } from "react";
import {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  ControlButton,
} from "@xyflow/react";
import { useQuery } from "@tanstack/react-query";
import type { ComponentSpec } from "../componentSpec";
import GraphComponentSpecFlow from "../DragNDrop/GraphComponentSpecFlow";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";
import { type ComponentReferenceWithSpec } from "../componentStore";
import { DndContext } from "@dnd-kit/core";
import { useNavigate } from "@tanstack/react-router";

import { runDetailRoute, type RunDetailParams } from "@/router";
import { CopyIcon } from "lucide-react";
import { copyRunToPipeline } from "@/utils/copyRunToPipeline";

const GRID_SIZE = 10;

const RunDetails = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const navigate = useNavigate();
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

  const { data: stateData, isLoading: stateLoading } = useQuery({
    queryKey: ["run_state", id],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${id}/state`,
      ).then((response) => response.json()),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

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

  const handleCopy = async () => {
    const result = await copyRunToPipeline(componentSpec);
    if (result?.url) {
      navigate({ to: result.url });
    } else {
      console.error("Failed to copy run to pipeline");
    }
  };

  return (
    <div className="dndflow">
      <DndContext>
        <ReactFlowProvider>
          <div className="reactflow-wrapper h-full w-full">
            <GraphComponentSpecFlow
              componentSpec={newComponentSpec}
              setComponentSpec={() => {}}
              snapToGrid={true}
              snapGrid={[GRID_SIZE, GRID_SIZE]}
              nodesDraggable={false}
              fitView
            >
              <MiniMap />
              <Controls className="transform scale-150 translate-y-[-40px]">
                <ControlButton onClick={handleCopy}>
                  <CopyIcon />
                </ControlButton>
              </Controls>
              <Background gap={GRID_SIZE} />
            </GraphComponentSpecFlow>
          </div>
        </ReactFlowProvider>
      </DndContext>
    </div>
  );
};

export default RunDetails;
