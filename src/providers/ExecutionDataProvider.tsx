import { useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { usePipelineRunData } from "@/hooks/usePipelineRunData";
import {
  createRequiredContext,
  useRequiredContext,
} from "@/hooks/useRequiredContext";
import { processExecutionStatuses } from "@/services/executionService";
import type { ExecutionStatus } from "@/types/pipelineRun";

import { useComponentSpec } from "./ComponentSpecProvider";

interface CachedExecutionData {
  executionId: string;
  details: GetExecutionInfoResponse;
  state: GetGraphExecutionStateResponse;
}

interface ExecutionDataContextType {
  currentExecutionId: string | undefined;
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  rootExecutionId: string | undefined;
  rootDetails: GetExecutionInfoResponse | undefined;
  rootState: GetGraphExecutionStateResponse | undefined;
  runId: string | undefined | null;
  status: ExecutionStatus | undefined;
  isLoading: boolean;
  error: Error | null;
}

const ExecutionDataContext = createRequiredContext<ExecutionDataContextType>(
  "ExecutionDataProvider",
);

const PATH_DELIMITER = ".";
const ROOT_PATH_START_INDEX = 1;

const isAtRootLevel = (path: string[]) => path.length <= 1;

const buildPathKey = (path: string[]) => path.join(PATH_DELIMITER);

/**
 * Traverses subgraph path to find execution ID at target level.
 * Example: ["root", "task-1", "task-2"] returns execution ID for task-2.
 */
const findExecutionIdAtPath = (
  path: string[],
  rootExecutionId: string | undefined,
  rootDetails: GetExecutionInfoResponse | undefined,
  cache: Map<string, CachedExecutionData>,
  queryClient: ReturnType<typeof useQueryClient>,
): string => {
  if (!rootExecutionId) {
    return "";
  }

  let currentId = rootExecutionId;
  let currentDetails = rootDetails;

  for (let i = ROOT_PATH_START_INDEX; i < path.length; i++) {
    const taskId = path[i];
    const pathKey = buildPathKey(path.slice(0, i + 1));

    const cachedData = cache.get(pathKey);
    if (cachedData) {
      currentId = cachedData.executionId;
      currentDetails = cachedData.details;
      continue;
    }

    const nextExecutionId = currentDetails?.child_task_execution_ids?.[taskId];
    if (!nextExecutionId) {
      break;
    }

    currentId = nextExecutionId;

    const cachedQueryData = queryClient.getQueryData<{
      details: GetExecutionInfoResponse;
      state: GetGraphExecutionStateResponse;
    }>(["pipeline-run", nextExecutionId]);

    if (cachedQueryData) {
      currentDetails = cachedQueryData.details;
      cache.set(pathKey, {
        executionId: nextExecutionId,
        details: cachedQueryData.details,
        state: cachedQueryData.state,
      });
    } else {
      currentDetails = undefined;
    }
  }

  return currentId;
};

export function ExecutionDataProvider({
  pipelineRunId,
  children,
}: PropsWithChildren<{ pipelineRunId: string }>) {
  const queryClient = useQueryClient();
  const { currentSubgraphPath } = useComponentSpec();

  const [status, setStatus] = useState<ExecutionStatus>();

  const executionDataCache = useRef<Map<string, CachedExecutionData>>(
    new Map(),
  );

  const {
    executionData,
    rootExecutionId,
    isLoading: isLoadingPipelineRunData,
    error: pipelineRunError,
  } = usePipelineRunData(pipelineRunId);

  const { details: rootDetails, state: rootState } = executionData ?? {};
  const runId = rootDetails?.pipeline_run_id;

  const isAtRoot = isAtRootLevel(currentSubgraphPath);

  const currentExecutionId = useMemo(() => {
    if (isAtRoot) {
      return rootExecutionId;
    }

    return findExecutionIdAtPath(
      currentSubgraphPath,
      rootExecutionId,
      rootDetails,
      executionDataCache.current,
      queryClient,
    );
  }, [
    currentSubgraphPath,
    rootExecutionId,
    rootDetails,
    isAtRoot,
    queryClient,
  ]);

  const {
    executionData: nestedExecutionData,
    isLoading: isNestedLoading,
    error: nestedError,
  } = usePipelineRunData(currentExecutionId || "");

  const { details: nestedDetails, state: nestedState } =
    nestedExecutionData ?? {};

  const details = isAtRoot ? rootDetails : nestedDetails;
  const state = isAtRoot ? rootState : nestedState;
  const isLoading = isAtRoot ? isLoadingPipelineRunData : isNestedLoading;
  const error = isAtRoot ? pipelineRunError : nestedError;

  useEffect(() => {
    if (!nestedDetails || !nestedState || isAtRoot) {
      return;
    }

    const pathKey = buildPathKey(currentSubgraphPath);
    executionDataCache.current.set(pathKey, {
      executionId: currentExecutionId || "",
      details: nestedDetails,
      state: nestedState,
    });
  }, [
    nestedDetails,
    nestedState,
    currentExecutionId,
    currentSubgraphPath,
    isAtRoot,
  ]);

  useEffect(() => {
    const status = processExecutionStatuses(details, state);
    setStatus(status);
  }, [details, state]);

  const value = useMemo(
    () => ({
      currentExecutionId,
      details,
      state,
      rootExecutionId,
      rootDetails,
      rootState,
      runId,
      status,
      isLoading,
      error,
    }),
    [
      currentExecutionId,
      details,
      state,
      rootExecutionId,
      rootDetails,
      rootState,
      runId,
      status,
      isLoading,
      error,
    ],
  );

  return (
    <ExecutionDataContext.Provider value={value}>
      {children}
    </ExecutionDataContext.Provider>
  );
}

export function useExecutionData() {
  return useRequiredContext(ExecutionDataContext);
}

/**
 * Optional version of useExecutionData that returns undefined if provider is not present.
 * Use in components that work in both editor and run contexts.
 */
export function useExecutionDataOptional() {
  const context = useContext(ExecutionDataContext);
  return context || undefined;
}
