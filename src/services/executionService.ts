import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import type { TaskStatusCounts } from "@/types/pipelineRun";

export const fetchExecutionState = async (
  executionId: string,
  backendUrl: string,
) => {
  const response = await fetch(
    `${backendUrl}/api/executions/${executionId}/state`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch execution state: ${response.statusText}`);
  }
  return response.json();
};

export const fetchExecutionDetails = async (
  executionId: string,
  backendUrl: string,
): Promise<GetExecutionInfoResponse> => {
  const response = await fetch(
    `${backendUrl}/api/executions/${executionId}/details`,
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch execution details: ${response.statusText}`,
    );
  }
  return response.json();
};

export const useFetchExecutionInfo = (
  executionId: string,
  backendUrl: string,
  poll: boolean = false,
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
  });

  const isLoading = isDetailsLoading || isStateLoading;
  const isFetching = isDetailsFetching || isStateFetching;
  const error = detailsError || stateError;
  const data = { state, details };

  const refetch = useCallback(() => {
    refetchDetails();
    refetchState();
  }, [refetchDetails, refetchState]);

  return { data, isLoading, isFetching, error, refetch };
};

export const fetchExecutionStatus = async (
  executionId: string,
  backendUrl: string,
) => {
  try {
    const response = await fetch(
      `${backendUrl}/api/executions/${executionId}/details`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`,
      );
    }
    const details: GetExecutionInfoResponse = await response.json();

    const stateResponse = await fetch(
      `${backendUrl}/api/executions/${executionId}/state`,
    );
    if (!stateResponse.ok) {
      throw new Error(
        `Failed to fetch execution state: ${stateResponse.statusText}`,
      );
    }
    const stateData: GetGraphExecutionStateResponse =
      await stateResponse.json();

    const taskStatuses = countTaskStatuses(details, stateData);
    const runStatus = getRunStatus(taskStatuses);

    return runStatus;
  } catch (error) {
    console.error(
      `Error fetching task statuses for run ${executionId}:`,
      error,
    );
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

/**
 * Count task statuses from API response
 */
export const countTaskStatuses = (
  details: GetExecutionInfoResponse,
  stateData: GetGraphExecutionStateResponse,
): TaskStatusCounts => {
  let succeeded = 0,
    failed = 0,
    running = 0,
    waiting = 0,
    skipped = 0,
    cancelled = 0;

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

        switch (status) {
          case "SUCCEEDED":
            succeeded++;
            break;
          case "FAILED":
          case "SYSTEM_ERROR":
          case "INVALID":
          case "UPSTREAM_FAILED":
            failed++;
            break;
          case "UPSTREAM_FAILED_OR_SKIPPED":
          case "CANCELLING":
            skipped++;
            break;
          case "RUNNING":
          case "STARTING":
            running++;
            break;
          case "CANCELLED":
            cancelled++;
            break;
          default:
            waiting++;
            break;
        }
      } else {
        waiting++;
      }
    });
  }

  const total = succeeded + failed + running + waiting + skipped + cancelled;
  return { total, succeeded, failed, running, waiting, skipped, cancelled };
};
