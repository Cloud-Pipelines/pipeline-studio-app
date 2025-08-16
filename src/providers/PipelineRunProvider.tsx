import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import useToastNotification from "@/hooks/useToastNotification";
import { useBackend } from "@/providers/BackendProvider";
import {
  countTaskStatuses,
  getRunStatus,
  isStatusComplete,
  useFetchExecutionInfo,
} from "@/services/executionService";
import {
  cancelPipelineRun,
  copyRunToPipeline,
  fetchPipelineRunById,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";
import { removeTrailingDateFromTitle } from "@/utils/string";
import { submitPipelineRun } from "@/utils/submitPipeline";

type PipelineRunContextType = {
  details: GetExecutionInfoResponse | undefined;
  state: GetGraphExecutionStateResponse | undefined;
  metadata: PipelineRun | null;
  status: string;

  isLoading: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  isCloning: boolean;
  error: Error | null;

  rerun: (
    componentSpec: ComponentSpec,
    options?: {
      onSuccess?: (data: PipelineRun) => void;
      onError?: (error: Error | string) => void;
    },
  ) => Promise<void>;
  cancel: () => Promise<void>;
  clone: (
    componentSpec: ComponentSpec,
  ) => Promise<{ name: string; url: string } | undefined>;
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
  const { awaitAuthorization, isAuthorized } = useAwaitAuthorization();
  const { getToken } = useAuthLocalStorage();
  const { backendUrl, available } = useBackend();
  const navigate = useNavigate();
  const notify = useToastNotification();

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

  const fetchRunMetadata = useCallback(async () => {
    if (!details?.pipeline_run_id) {
      setMetadata(null);
      return;
    }

    try {
      const data = await fetchPipelineRunById(details.pipeline_run_id);
      setMetadata(data);
    } catch (err) {
      console.error("Failed to fetch run metadata:", err);
      setMetadata(null);
    }
  }, [details?.pipeline_run_id]);

  useEffect(() => {
    fetchRunMetadata();
  }, [fetchRunMetadata]);

  const { mutate: cancelRun, isPending: isCancelling } = useMutation({
    mutationFn: (runId: string) => cancelPipelineRun(runId, backendUrl),
    onSuccess: () => {
      notify(`Pipeline run cancelled`, "success");
    },
    onError: (error) => {
      notify(`Error cancelling run: ${error}`, "error");
    },
  });

  // temp -- method ok
  const { mutate: cloneRun, isPending: isCloning } = useMutation({
    mutationFn: async (componentSpec: ComponentSpec) => {
      const name = getInitialName(componentSpec);
      const copy = await copyRunToPipeline(componentSpec, name);

      if (!copy.url) {
        throw new Error("Failed to clone pipeline");
      }

      return copy;
    },
    onSuccess: (result) => {
      notify(`Pipeline "${result.name}" cloned`, "success");
      navigate({ to: result.url });
    },
    onError: (error) => {
      notify(`Error cloning pipeline: ${error}`, "error");
    },
  });

  // temp -- method ok
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

  // temp -- method ok
  const cancel = useCallback(async () => {
    const runId = details?.pipeline_run_id;

    if (!runId) {
      notify(`Failed to cancel run. No run ID found.`, "warning");
      return;
    }

    if (!available) {
      notify(`Backend is not available. Cannot cancel run.`, "warning");
      return;
    }

    cancelRun(runId);
  }, [details?.pipeline_run_id, available, cancelRun, notify]);

  // temp -- method ok
  const clone = useCallback(
    async (componentSpec: ComponentSpec) => {
      return new Promise<{ name: string; url: string } | undefined>(
        (resolve, reject) => {
          cloneRun(componentSpec, {
            onSuccess: (result) => resolve(result),
            onError: (error) => reject(error),
          });
        },
      );
    },
    [cloneRun],
  );

  useEffect(() => {
    if (executionError) {
      setError(executionError);
    }
  }, [executionError]);

  useEffect(() => {
    if (details && state) {
      const statusCounts = countTaskStatuses(details, state);
      const runStatus = getRunStatus(statusCounts);
      setStatus(runStatus);

      const shouldPollStatus =
        backendUrl && rootExecutionId && !isStatusComplete(runStatus);
      if (shouldPollStatus) {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
    }
  }, [details, state, backendUrl, rootExecutionId]);

  useEffect(() => {
    refetchExecutionInfo();
  }, [backendUrl]);

  // TODO:
  // need to check each method that it does what I want it to
  // need to remove polling and use live status and streamed logs
  // see https://github.com/Shopify/oasis-frontend/issues/171
  // adapt the RootExecutionStatusProvider test file to this provider
  const value = useMemo(
    () => ({
      details,
      state,
      status,
      metadata, // todo: do we need metadata, details and state? check if there's overlap. Metadata is from local storage, details is from db... so maybe yes we need both
      isLoading,
      isSubmitting,
      isCancelling,
      isCloning,
      error,
      rerun,
      cancel,
      clone,
    }),
    [
      details,
      state,
      status,
      metadata,
      isLoading,
      isSubmitting,
      isCancelling,
      isCloning,
      error,
      rerun,
      cancel,
      clone,
    ],
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

function getInitialName(componentSpec: ComponentSpec): string {
  const dateTime = new Date().toISOString();
  const baseName = componentSpec?.name || "Pipeline";

  return `${removeTrailingDateFromTitle(baseName)} (${dateTime})`;
}
