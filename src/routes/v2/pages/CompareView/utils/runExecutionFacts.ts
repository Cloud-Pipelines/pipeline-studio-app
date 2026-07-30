import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import {
  flattenExecutionStatusStats,
  getOverallExecutionStatusFromStats,
  isInProgressStatus,
} from "@/utils/executionStatus";

export function runOverallStatus(
  state: GetGraphExecutionStateResponse | undefined,
): string | undefined {
  return getOverallExecutionStatusFromStats(
    flattenExecutionStatusStats(state?.child_execution_status_stats),
  );
}

/**
 * Wall clock between the run's first and last observed status. The status
 * history is the only run-level timing the backend reports — `started_at` and
 * `ended_at` exist per container, not per run — and it only describes a duration
 * once the run has stopped moving, so an in-flight run reports nothing rather
 * than a figure that grows every poll.
 */
export function runDurationMs(
  details: GetExecutionInfoResponse | undefined,
): number | undefined {
  const history = details?.status_history;
  if (!history || history.length < 2) return undefined;

  const last = history[history.length - 1];
  if (isInProgressStatus(last.status)) return undefined;

  const start = Date.parse(history[0].first_observed_at);
  const end = Date.parse(last.first_observed_at);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return undefined;

  return end - start;
}
