import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

import { type TaskStatusCounts } from "./types";

/**
 * Count task statuses from API response
 */
export const countTaskStatuses = (
  details: GetExecutionInfoResponse,
  stateData: GetGraphExecutionStateResponse
): TaskStatusCounts => {
  let succeeded = 0,
    failed = 0,
    running = 0,
    pending = 0;

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

        if (status === "SUCCEEDED") {
          succeeded++;
        } else if (
          [
            "FAILED",
            "SYSTEM_ERROR",
            "INVALID",
            "UPSTREAM_FAILED",
            "UPSTREAM_FAILED_OR_SKIPPED",
          ].includes(status)
        ) {
          failed++;
        } else if (["RUNNING", "STARTING", "CANCELLING"].includes(status)) {
          running++;
        } else {
          pending++;
        }
      } else {
        pending++;
      }
    });
  }

  const total = succeeded + failed + running + pending;
  return { total, succeeded, failed, running, pending };
};

/**
 * Determine the overall run status based on the task statuses.
 */
export const getRunStatus = (statusData: TaskStatusCounts) => {
  if (statusData.failed > 0) {
    return "FAILED";
  }
  if (statusData.running > 0) {
    return "RUNNING";
  }
  if (statusData.pending > 0) {
    return "PENDING";
  }
  if (statusData.succeeded > 0) {
    return "SUCCEEDED";
  }
  return "UNKNOWN";
};

/**
 * Format date string to localized string
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
