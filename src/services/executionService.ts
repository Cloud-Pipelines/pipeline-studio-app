import { useQuery } from "@tanstack/react-query";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { API_URL } from "@/utils/constants";

export const fetchExecutionState = async (executionId: string) => {
  const response = await fetch(
    `${API_URL}/api/executions/${executionId}/state`,
  );
  console.log("response", response);
  if (!response.ok) {
    throw new Error(`Failed to fetch execution state: ${response.statusText}`);
  }
  return response.json();
};

export const fetchExecutionInfo = (executionId: string) => {
  const fetchDetails = async (): Promise<GetExecutionInfoResponse> => {
    const response = await fetch(
      `${API_URL}/api/executions/${executionId}/details`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`,
      );
    }
    return response.json();
  };

  const {
    data: details,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery<GetExecutionInfoResponse>({
    queryKey: ["pipeline-run-details", executionId],
    queryFn: fetchDetails,
  });

  const {
    data: state,
    isLoading: isStateLoading,
    error: stateError,
  } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["pipeline-run-state", executionId],
    queryFn: () => fetchExecutionState(executionId),
  });

  const isLoading = isDetailsLoading || isStateLoading;
  const error = detailsError || stateError;
  const data = { state, details };

  return { data, isLoading, error };
};

export const fetchExecutionStatus = async (executionId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/api/executions/${executionId}/details`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`,
      );
    }
    const details: GetExecutionInfoResponse = await response.json();

    const stateResponse = await fetch(
      `${API_URL}/api/executions/${executionId}/state`,
    );

    console.log("stateResponse", stateResponse);
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

export interface TaskStatusCounts {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  waiting: number;
  skipped: number;
}

/**
 * Determine the overall run status based on the task statuses.
 */
const STATUS = {
  FAILED: "FAILED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  WAITING: "WAITING",
  UNKNOWN: "UNKNOWN",
} as const;

export const getRunStatus = (statusData: TaskStatusCounts) => {
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
    skipped = 0;

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
          default:
            waiting++;
            break;
        }
      } else {
        waiting++;
      }
    });
  }

  const total = succeeded + failed + running + waiting + skipped;
  return { total, succeeded, failed, running, waiting, skipped };
};
