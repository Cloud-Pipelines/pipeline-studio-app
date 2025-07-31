import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { useBackend } from "@/providers/BackendProvider";
import {
  countTaskStatuses,
  getRunStatus,
  isStatusComplete,
  useFetchExecutionInfo,
} from "@/services/executionService";

interface RootExecutionStatus {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  runId: string | undefined | null;
  isLoading: boolean;
  error: Error | null;
}

const RootExecutionContext = createContext<RootExecutionStatus | null>(null);

export function RootExecutionStatusProvider({
  rootExecutionId,
  children,
}: PropsWithChildren<{ rootExecutionId: string }>) {
  const { backendUrl } = useBackend();

  const [isPolling, setIsPolling] = useState(true);

  const { data, isLoading, error } = useFetchExecutionInfo(
    rootExecutionId,
    backendUrl,
    isPolling,
  );
  const { details, state } = data;
  const runId = details?.pipeline_run_id;

  useEffect(() => {
    if (details && state) {
      const statusCounts = countTaskStatuses(details, state);
      const runStatus = getRunStatus(statusCounts);
      if (isStatusComplete(runStatus)) {
        setIsPolling(false);
      }
    }
  }, [details, state]);

  const value = useMemo(
    () => ({
      details,
      state,
      runId,
      isLoading,
      error,
    }),
    [details, state, runId, isLoading, error],
  );

  return (
    <RootExecutionContext.Provider value={value}>
      {children}
    </RootExecutionContext.Provider>
  );
}

export function useRootExecutionContext() {
  const ctx = useContext(RootExecutionContext);
  if (!ctx)
    throw new Error(
      "useRootExecutionContext must be used within RootExecutionContext",
    );
  return ctx;
}
