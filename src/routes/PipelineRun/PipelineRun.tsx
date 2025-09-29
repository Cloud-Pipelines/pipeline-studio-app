import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";

import type { GetExecutionInfoResponse } from "@/api/types.gen";
import PipelineRunPage from "@/components/PipelineRun";
import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { faviconManager } from "@/favicon";
import { useCurrentLevelExecutionData } from "@/hooks/useCurrentLevelExecutionData";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type RunDetailParams, runDetailRoute } from "@/routes/router";
import {
  countTaskStatuses,
  getRunStatus,
  STATUS,
} from "@/services/executionService";
import { getBackendStatusString } from "@/utils/backend";
import type { ComponentSpec } from "@/utils/componentSpec";

const PipelineRun = () => {
  const { setComponentSpec, clearComponentSpec, componentSpec } =
    useComponentSpec();
  const { configured, available, ready } = useBackend();
  const { id: rootExecutionId } = runDetailRoute.useParams() as RunDetailParams;

  const { details, state, isLoading, error, rootDetails } =
    useCurrentLevelExecutionData(rootExecutionId);

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
    if (rootDetails?.task_spec.componentRef.spec) {
      const componentSpecWithExecutionIds = addExecutionIdToComponent(
        rootDetails.task_spec.componentRef.spec as ComponentSpec,
        rootDetails,
      );

      setComponentSpec(componentSpecWithExecutionIds);
    }
    return () => {
      clearComponentSpec();
    };
  }, [rootDetails, setComponentSpec, clearComponentSpec]);

  useDocumentTitle({
    "/runs/$id": (params) =>
      `Oasis - ${componentSpec?.name || ""} - ${params.id}`,
  });

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

const mapRunStatusToFavicon = (
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
