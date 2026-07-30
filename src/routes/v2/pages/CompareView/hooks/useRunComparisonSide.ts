import { usePipelineRunData } from "@/hooks/usePipelineRunData";
import {
  runDurationMs,
  runOverallStatus,
} from "@/routes/v2/pages/CompareView/utils/runExecutionFacts";
import { useFetchPipelineRunMetadata } from "@/services/executionService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { buildTaskExecutionStatusMap } from "@/utils/executionStatus";

export interface RunComparisonSide {
  runId: string;
  spec: ComponentSpec | undefined;
  taskStatusMap: Map<string, string>;
  taskExecutionIdMap: Map<string, string>;
  createdBy?: string;
  createdAt?: string;
  status?: string;
  durationMs?: number;
  runAnnotations?: Record<string, unknown>;
  runArguments?: Record<string, unknown>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Loads a single run's spec and per-task execution status for the comparison
 * view. Safe to call twice in one component (once per side) because
 * `usePipelineRunData` scopes all of its queries by id. Pass an empty string
 * for an unselected side — the underlying queries stay disabled.
 */
export function useRunComparisonSide(runId: string): RunComparisonSide {
  const { executionData, error } = usePipelineRunData(runId);
  const { data: runMetadata } = useFetchPipelineRunMetadata(runId || undefined);

  const details = executionData?.details;
  const state = executionData?.state;

  const spec =
    (details?.task_spec.componentRef.spec as
      ComponentSpec | null | undefined) ?? undefined;

  const taskStatusMap = buildTaskExecutionStatusMap(details, state);

  const taskExecutionIdMap = new Map<string, string>(
    Object.entries(details?.child_task_execution_ids ?? {}),
  );

  return {
    runId,
    spec,
    taskStatusMap,
    taskExecutionIdMap,
    createdBy: runMetadata?.created_by ?? undefined,
    createdAt: runMetadata?.created_at ?? undefined,
    status: runOverallStatus(state),
    durationMs: runDurationMs(details),
    runAnnotations: runMetadata?.annotations ?? undefined,
    runArguments: details?.task_spec.arguments ?? undefined,
    isLoading: Boolean(runId) && !executionData && !error,
    error: error ?? null,
  };
}
