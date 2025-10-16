import { createContext, type ReactNode, useContext } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

const DEFAULT_TASK_STATUS = "WAITING_FOR_UPSTREAM";

interface CurrentExecutionContextType {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
}

const CurrentExecutionContext = createContext<
  CurrentExecutionContextType | undefined
>(undefined);

export const CurrentExecutionProvider = ({
  details,
  state,
  children,
}: {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  children: ReactNode;
}) => {
  return (
    <CurrentExecutionContext.Provider value={{ details, state }}>
      {children}
    </CurrentExecutionContext.Provider>
  );
};

export const useCurrentExecution = () => {
  const context = useContext(CurrentExecutionContext);
  // Return empty defaults if not in a run context (e.g., in Editor)
  return context ?? { details: undefined, state: undefined };
};

/**
 * Gets the execution status for a specific task
 * Used to compute status on-demand instead of building entire map
 */
export const getTaskStatus = (
  details: GetExecutionInfoResponse | undefined,
  state: GetGraphExecutionStateResponse | undefined,
  taskId: string,
): string => {
  if (!details?.child_task_execution_ids) {
    return DEFAULT_TASK_STATUS;
  }

  const executionId = details.child_task_execution_ids[taskId];
  if (!executionId) {
    return DEFAULT_TASK_STATUS;
  }

  const statusStats = state?.child_execution_status_stats?.[executionId];
  if (!statusStats) {
    return DEFAULT_TASK_STATUS;
  }

  // Extract the first status from the stats object
  const statuses = Object.keys(statusStats);
  return statuses.length > 0 ? statuses[0] : DEFAULT_TASK_STATUS;
};
