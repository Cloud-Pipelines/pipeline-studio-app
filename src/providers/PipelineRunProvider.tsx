import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import {
  createRequiredContext,
  useRequiredContext,
} from "@/hooks/useRequiredContext";
import { useBackend } from "@/providers/BackendProvider";
import {
  countTaskStatuses,
  getRunStatus,
  isStatusComplete,
  useFetchExecutionInfo,
} from "@/services/executionService";
import { fetchPipelineRunById } from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";

type PipelineRunContextType = {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  metadata: PipelineRun | null;
  status: string;

  isLoading: boolean;
  error: Error | null;
};

const PipelineRunContext = createRequiredContext<PipelineRunContextType>(
  "PipelineRunProvider",
);

export const PipelineRunProvider = ({
  rootExecutionId,
  children,
}: {
  rootExecutionId: string;
  children: ReactNode;
}) => {
  const { backendUrl } = useBackend();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);
  const [status, setStatus] = useState<string>("UNKNOWN");

  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    data,
    isLoading,
    error: executionError,
    refetch: refetchExecutionInfo,
  } = useFetchExecutionInfo(rootExecutionId, backendUrl, isPolling);

  const { details, state } = data;

  const runId = useMemo(
    () => details?.pipeline_run_id,
    [details?.pipeline_run_id],
  );

  const fetchRunMetadata = useCallback(async () => {
    if (!runId) {
      setMetadata(null);
      return;
    }

    try {
      const data = await fetchPipelineRunById(runId);
      setMetadata(data);
    } catch (err) {
      console.error("Failed to fetch run metadata:", err);
      setMetadata(null);
    }
  }, [runId]);

  useEffect(() => {
    fetchRunMetadata();
  }, [fetchRunMetadata]);

  useEffect(() => {
    if (executionError) {
      setError(executionError);
    }
  }, [executionError]);

  useEffect(() => {
    if (details && state) {
      const taskStatusCounts = countTaskStatuses(details, state);
      const runStatus = getRunStatus(taskStatusCounts);
      setStatus(runStatus);
    }
  }, [details, state]);

  useEffect(() => {
    const shouldPollStatus =
      backendUrl && rootExecutionId && !isStatusComplete(status);

    if (shouldPollStatus) {
      setIsPolling(true);
    } else {
      setIsPolling(false);
    }
  }, [status, backendUrl]);

  useEffect(() => {
    refetchExecutionInfo();
  }, [backendUrl]);

  const value = useMemo(
    () => ({
      details,
      state,
      status,
      metadata,
      isLoading,
      error,
    }),
    [details, state, status, metadata, isLoading, error],
  );

  return (
    <PipelineRunContext.Provider value={value}>
      {children}
    </PipelineRunContext.Provider>
  );
};

export const usePipelineRun = () => {
  return useRequiredContext(PipelineRunContext);
};
