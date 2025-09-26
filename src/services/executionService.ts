import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type {
  GetArtifactsApiExecutionsIdArtifactsGetResponse,
  GetContainerExecutionStateResponse,
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
  PipelineRunResponse,
} from "@/api/types.gen";
import type { TaskStatusCounts } from "@/types/pipelineRun";
import { fetchWithErrorHandling } from "@/utils/fetchWithErrorHandling";

export const fetchExecutionState = async (
  executionId: string,
  backendUrl: string,
) => {
  const url = `${backendUrl}/api/executions/${executionId}/state`;
  return fetchWithErrorHandling(url);
};

export const fetchExecutionDetails = async (
  executionId: string,
  backendUrl: string,
): Promise<GetExecutionInfoResponse> => {
  const url = `${backendUrl}/api/executions/${executionId}/details`;
  return fetchWithErrorHandling(url);
};

export const fetchPipelineRun = async (
  runId: string,
  backendUrl: string,
): Promise<PipelineRunResponse> => {
  const response = await fetch(`${backendUrl}/api/pipeline_runs/${runId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline run: ${response.statusText}`);
  }
  return response.json();
};

const fetchContainerExecutionState = async (
  executionId: string,
  backendUrl: string,
): Promise<GetContainerExecutionStateResponse> => {
  const url = `${backendUrl}/api/executions/${executionId}/container_state`;
  return fetchWithErrorHandling(url);
};

export const useFetchContainerExecutionState = (
  executionId: string | undefined,
  backendUrl: string,
) => {
  return useQuery<GetContainerExecutionStateResponse>({
    queryKey: ["container-execution-state", executionId],
    queryFn: () => fetchContainerExecutionState(executionId!, backendUrl),
    enabled: !!executionId,
    refetchOnWindowFocus: false,
  });
};

export const useFetchPipelineRun = (
  runId: string,
  backendUrl: string,
  enabled: boolean = true,
) => {
  return useQuery<PipelineRunResponse>({
    queryKey: ["pipeline-run", runId],
    queryFn: () => fetchPipelineRun(runId, backendUrl),
    enabled,
    refetchOnWindowFocus: false,
  });
};

export const useFetchExecutionInfo = (
  executionId: string,
  backendUrl: string,
  poll: boolean = false,
  enabled: boolean = true,
) => {
  const {
    data: details,
    isLoading: isDetailsLoading,
    isFetching: isDetailsFetching,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery<GetExecutionInfoResponse>({
    queryKey: ["pipeline-run-details", executionId],
    refetchOnWindowFocus: false,
    queryFn: () => fetchExecutionDetails(executionId, backendUrl),
    refetchInterval: poll ? 5000 : false,
    enabled,
  });

  const {
    data: state,
    isLoading: isStateLoading,
    isFetching: isStateFetching,
    error: stateError,
    refetch: refetchState,
  } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["pipeline-run-state", executionId],
    refetchOnWindowFocus: false,
    queryFn: () => fetchExecutionState(executionId, backendUrl),
    refetchInterval: poll ? 5000 : false,
    enabled,
  });

  const isLoading = isDetailsLoading || isStateLoading;
  const isFetching = isDetailsFetching || isStateFetching;
  const error = detailsError || stateError;
  const data = { state, details };

  const refetch = useCallback(() => {
    refetchDetails();
    refetchState();
  }, [refetchDetails, refetchState]);

  return { data, isLoading, isFetching, error, refetch, enabled };
};

export const fetchExecutionStatus = async (
  executionId: string,
  backendUrl: string,
) => {
  try {
    const details: GetExecutionInfoResponse = await fetchExecutionDetails(
      executionId,
      backendUrl,
    );
    const stateData: GetGraphExecutionStateResponse = await fetchExecutionState(
      executionId,
      backendUrl,
    );

    const taskStatuses = countTaskStatuses(details, stateData);
    const runStatus = getRunStatus(taskStatuses);

    return runStatus;
  } catch (error) {
    console.error(
      `Error fetching task statuses for run ${executionId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Determine the overall run status based on the task statuses.
 */
export const STATUS = {
  FAILED: "FAILED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  WAITING: "WAITING",
  CANCELLED: "CANCELLED",
  UNKNOWN: "UNKNOWN",
} as const;

export const getRunStatus = (statusData: TaskStatusCounts) => {
  if (statusData.cancelled > 0) {
    return STATUS.CANCELLED;
  }
  if (statusData.failed > 0) {
    return STATUS.FAILED;
  }
  if (statusData.running > 0) {
    return STATUS.RUNNING;
  }
  if (statusData.waiting > 0) {
    return STATUS.WAITING;
  }
  if (statusData.succeeded > 0) {
    return STATUS.SUCCEEDED;
  }
  return STATUS.UNKNOWN;
};

export const isStatusInProgress = (status: string = "") => {
  return status === STATUS.RUNNING || status === STATUS.WAITING;
};

export const isStatusComplete = (status: string = "") => {
  return (
    status === STATUS.SUCCEEDED ||
    status === STATUS.FAILED ||
    status === STATUS.CANCELLED
  );
};

const mapStatus = (status: string) => {
  switch (status) {
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
    case "SYSTEM_ERROR":
    case "INVALID":
    case "UPSTREAM_FAILED":
      return "failed";
    case "UPSTREAM_FAILED_OR_SKIPPED":
    case "CANCELLING":
    case "SKIPPED":
      return "skipped";
    case "RUNNING":
    case "STARTING":
      return "running";
    case "CANCELLED":
      return "cancelled";
    default:
      return "waiting";
  }
};

/**
 * Count task statuses from API response
 */
export const countTaskStatuses = (
  details: GetExecutionInfoResponse,
  stateData: GetGraphExecutionStateResponse,
): TaskStatusCounts => {
  const statusCounts = {
    total: 0,
    succeeded: 0,
    failed: 0,
    running: 0,
    waiting: 0,
    skipped: 0,
    cancelled: 0,
  };

  if (
    details.child_task_execution_ids &&
    stateData.child_execution_status_stats
  ) {
    Object.values(details.child_task_execution_ids).forEach((executionId) => {
      const executionIdStr = String(executionId);
      const statusStats =
        stateData.child_execution_status_stats[executionIdStr];

      if (statusStats) {
        const status = Object.keys(statusStats)[0];
        const mappedStatus = mapStatus(status);
        statusCounts[mappedStatus as keyof TaskStatusCounts]++;
      } else {
        statusCounts.waiting++;
      }
    });
  }

  const total =
    statusCounts.succeeded +
    statusCounts.failed +
    statusCounts.running +
    statusCounts.waiting +
    statusCounts.skipped +
    statusCounts.cancelled;

  return { ...statusCounts, total };
};

export const getExecutionArtifacts = async (
  executionId: string,
  backendUrl: string,
) => {
  if (!executionId) return null;
  const response = await fetch(
    `${backendUrl}/api/executions/${executionId}/artifacts`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch artifacts: ${response.statusText}`);
  }
  return response.json() as Promise<GetArtifactsApiExecutionsIdArtifactsGetResponse>;
};

export const convertExecutionStatsToStatusCounts = (
  stats: { [key: string]: number } | null | undefined,
): TaskStatusCounts => {
  const statusCounts = {
    total: 0,
    succeeded: 0,
    failed: 0,
    running: 0,
    waiting: 0,
    skipped: 0,
    cancelled: 0,
  };

  if (!stats) {
    return statusCounts;
  }

  Object.entries(stats).forEach(([status, count]) => {
    const mappedStatus = mapStatus(status);
    statusCounts[mappedStatus as keyof TaskStatusCounts] += count;
  });

  const total =
    statusCounts.succeeded +
    statusCounts.failed +
    statusCounts.running +
    statusCounts.waiting +
    statusCounts.skipped +
    statusCounts.cancelled;

  return { ...statusCounts, total };
};
