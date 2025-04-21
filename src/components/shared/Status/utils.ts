import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

import type { TaskStatusCounts } from "./types";

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
