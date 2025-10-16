import { useMatch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { runDetailRoute } from "@/routes/router";

import { usePipelineRunData } from "./usePipelineRunData";

interface CachedExecutionData {
  executionId: string;
  details: GetExecutionInfoResponse;
  state: GetGraphExecutionStateResponse;
}

const DEFAULT_TASK_STATUS = "WAITING_FOR_UPSTREAM";
const PATH_DELIMITER = ".";
const ROOT_PATH_START_INDEX = 1;

const isAtRootLevel = (path: string[]) => path.length <= 1;

const buildPathKey = (path: string[]) => path.join(PATH_DELIMITER);

/**
 * Walks through the subgraph path to find the execution ID at the target level
 * Uses cached data when available to avoid redundant lookups
 *
 * Example path: ["root", "task-1", "task-2"]
 * - Start at root execution ID
 * - Find execution ID for task-1 in root's child_task_execution_ids
 * - Find execution ID for task-2 in task-1's child_task_execution_ids
 * - Return the execution ID for task-2
 */
const findExecutionIdAtPath = (
  path: string[],
  rootExecutionId: string | undefined,
  rootDetails: GetExecutionInfoResponse | undefined,
  cache: Map<string, CachedExecutionData>,
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
    currentDetails = undefined;
  }

  return currentId;
};

/**
 * Extracts task status from execution state
 * The API returns status as an object with a single key (the status string)
 * and value (the count). We only need the status key.
 * Example: { "RUNNING": 1 } -> "RUNNING"
 */
const extractStatusFromStats = (
  statusStats: Record<string, number>,
): string | undefined => {
  const statuses = Object.keys(statusStats);
  return statuses.length > 0 ? statuses[0] : undefined;
};

const buildTaskStatusMap = (
  details?: GetExecutionInfoResponse,
  state?: GetGraphExecutionStateResponse,
): Map<string, string> => {
  const taskStatusMap = new Map<string, string>();

  if (!details?.child_task_execution_ids) {
    return taskStatusMap;
  }

  Object.entries(details.child_task_execution_ids).forEach(
    ([taskId, executionId]) => {
      const executionIdStr = executionId;
      const statusStats = state?.child_execution_status_stats?.[executionIdStr];

      const status = statusStats
        ? extractStatusFromStats(statusStats)
        : undefined;

      taskStatusMap.set(taskId, status ?? DEFAULT_TASK_STATUS);
    },
  );

  return taskStatusMap;
};

/**
 * Hook that dynamically fetches execution data for the currently viewed level
 * Handles both root level and subgraph levels, ensuring task status is available
 * when navigating into nested subgraphs
 *
 * This hook manages all data fetching internally, so parent components don't need
 * to fetch execution data separately.
 */
export const useCurrentLevelExecutionData = () => {
  const runMatch = useMatch({ from: runDetailRoute.id, shouldThrow: false });
  const rootExecutionOrRunId = (runMatch?.params as { id?: string })?.id || "";

  const { currentSubgraphPath, setTaskStatusMap } = useComponentSpec();

  const executionDataCache = useRef<Map<string, CachedExecutionData>>(
    new Map(),
  );

  const {
    executionData,
    rootExecutionId,
    isLoading: isLoadingPipelineRunData,
    error: pipelineRunError,
  } = usePipelineRunData(rootExecutionOrRunId);

  const { details: rootDetails, state: rootState } = executionData ?? {};

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
    );
  }, [currentSubgraphPath, rootExecutionId, rootDetails, isAtRoot]);

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

  // Cache nested subgraph data
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
    const taskStatusMap = buildTaskStatusMap(details, state);
    setTaskStatusMap(taskStatusMap);
  }, [details, state, setTaskStatusMap]);

  return {
    currentExecutionId,
    details,
    state,
    isLoading,
    error,
    rootDetails,
    rootState,
  };
};
