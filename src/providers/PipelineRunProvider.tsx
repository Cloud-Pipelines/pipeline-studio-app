import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { isAuthorizationRequired } from "@/components/shared/GitHubAuth/helpers";
import { useAuthLocalStorage } from "@/components/shared/GitHubAuth/useAuthLocalStorage";
import { useAwaitAuthorization } from "@/components/shared/GitHubAuth/useAwaitAuthorization";
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
import type { ComponentSpec } from "@/utils/componentSpec";
import { submitPipelineRun } from "@/utils/submitPipeline";

type PipelineRunContextType = {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  metadata: PipelineRun | null;
  status: string;

  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;

  rerun: (
    componentSpec: ComponentSpec,
    options?: {
      onSuccess?: (data: PipelineRun) => void;
      onError?: (error: Error | string) => void;
    },
  ) => Promise<void>;
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

  const { awaitAuthorization, isAuthorized } = useAwaitAuthorization();
  const { getToken } = useAuthLocalStorage();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);
  const [status, setStatus] = useState<string>("UNKNOWN");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const authorizationToken = useRef<string | undefined>(getToken());

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

  const rerun = useCallback(
    async (
      componentSpec: ComponentSpec,
      options?: {
        onSuccess?: (data: PipelineRun) => void;
        onError?: (error: Error | string) => void;
      },
    ) => {
      setIsSubmitting(true);
      setError(null);
      const authorizationRequired = isAuthorizationRequired();
      if (authorizationRequired && !isAuthorized) {
        const token = await awaitAuthorization();
        if (token) {
          authorizationToken.current = token;
        }
      }
      await submitPipelineRun(componentSpec, backendUrl, {
        authorizationToken: authorizationToken.current,
        onSuccess: (data) => {
          setIsSubmitting(false);
          options?.onSuccess?.(data);
        },
        onError: (error) => {
          setIsSubmitting(false);
          setError(error);
          options?.onError?.(error);
        },
      });
    },
    [isAuthorized, awaitAuthorization, backendUrl],
  );

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
      isSubmitting,
      error,
      rerun,
    }),
    [details, state, status, metadata, isLoading, isSubmitting, error, rerun],
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
