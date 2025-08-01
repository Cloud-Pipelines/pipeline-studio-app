import { useMutation } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { useAuthLocalStorage } from "@/hooks/useAuthLocalStorage";
import { useAwaitAuthorization } from "@/hooks/useAwaitAuthorization";
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
  createPipelineRun,
  fetchPipelineRunById,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import { isAuthorizationRequired } from "@/utils/auth";
import type { ComponentSpec } from "@/utils/componentSpec";
import {
  getArgumentsFromInputs,
  processComponentSpec,
} from "@/utils/componentUtils";
import { removeTrailingDateFromTitle } from "@/utils/string";

type PipelineRunContextType = {
  // Execution data
  executionDetails: GetExecutionInfoResponse | undefined;
  executionState: GetGraphExecutionStateResponse | undefined;
  runMetadata: PipelineRun | null;

  // Status
  isLoading: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  isCloning: boolean;
  error: Error | null;

  // Actions
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
  refetch: () => Promise<void>;
};

const PipelineRunContext = createContext<PipelineRunContextType | undefined>(
  undefined,
);

export const PipelineRunProvider = ({
  rootExecutionId,
  children,
}: {
  rootExecutionId: string;
  children: ReactNode;
}) => {
  const {
    awaitAuthorization,
    isAuthorized,
    isPopupOpen,
    closePopup,
    bringPopupToFront,
  } = useAwaitAuthorization();
  const { getToken } = useAuthLocalStorage();
  const { backendUrl, configured, available } = useBackend();
  const notify = useToastNotification();

  const [runMetadata, setRunMetadata] = useState<PipelineRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const authorizationToken = useRef<string | undefined>(getToken());

  // Fetch execution info with polling
  const {
    data,
    isLoading,
    error: executionError,
  } = useFetchExecutionInfo(rootExecutionId, backendUrl, isPolling);
  const { details: executionDetails, state: executionState } = data;

  // Stop polling when execution is complete
  useEffect(() => {
    if (executionDetails && executionState) {
      const statusCounts = countTaskStatuses(executionDetails, executionState);
      const runStatus = getRunStatus(statusCounts);
      if (isStatusComplete(runStatus)) {
        setIsPolling(false);
      }
    }
  }, [executionDetails, executionState]);

  // Fetch run metadata
  const fetchRunMetadata = useCallback(async () => {
    if (!executionDetails?.pipeline_run_id || !configured || !available) {
      setRunMetadata(null);
      return;
    }

    try {
      const metadata = await fetchPipelineRunById(
        executionDetails.pipeline_run_id,
      );
      setRunMetadata(metadata);
    } catch (err) {
      console.error("Failed to fetch run metadata:", err);
      setRunMetadata(null);
    }
  }, [executionDetails?.pipeline_run_id, configured, available]);

  useEffect(() => {
    fetchRunMetadata();
  }, [fetchRunMetadata]);

  // Cancel mutation
  const { mutate: cancelRun, isPending: isCancelling } = useMutation({
    mutationFn: (runId: string) => cancelPipelineRun(runId, backendUrl),
    onSuccess: () => {
      notify(`Pipeline run cancelled`, "success");
    },
    onError: (error) => {
      notify(`Error cancelling run: ${error}`, "error");
    },
  });

  // Clone mutation
  const { mutate: cloneRun, isPending: isCloning } = useMutation({
    mutationFn: async (componentSpec: ComponentSpec) => {
      const name = getInitialName(componentSpec);
      return copyRunToPipeline(componentSpec, name);
    },
    onSuccess: (result) => {
      if (result?.url) {
        notify(`Pipeline "${result.name}" cloned`, "success");
      }
    },
    onError: (error) => {
      notify(`Error cloning pipeline: ${error}`, "error");
    },
  });

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

      try {
        const authorizationRequired = isAuthorizationRequired();
        if (authorizationRequired && !isAuthorized) {
          const token = await awaitAuthorization();
          if (token) {
            authorizationToken.current = token;
          }
        }

        const specCopy = structuredClone(componentSpec);
        const componentCache = new Map<string, ComponentSpec>();
        const fullyLoadedSpec = await processComponentSpec(
          specCopy,
          componentCache,
          (_taskId, error) => {
            console.error("Error processing component spec:", error);
          },
        );
        const argumentsFromInputs = getArgumentsFromInputs(fullyLoadedSpec);

        const payload = {
          root_task: {
            componentRef: {
              spec: fullyLoadedSpec,
            },
            ...(argumentsFromInputs ? { arguments: argumentsFromInputs } : {}),
          },
        };

        const responseData = await createPipelineRun(
          payload as BodyCreateApiPipelineRunsPost,
          backendUrl,
          authorizationRequired ? authorizationToken.current : undefined,
        );

        options?.onSuccess?.(responseData);
        setIsSubmitting(false);
      } catch (e) {
        setIsSubmitting(false);
        setError(e as Error);
        options?.onError?.(e as Error);
      }
    },
    [isAuthorized, awaitAuthorization, backendUrl],
  );

  const cancel = useCallback(async () => {
    const runId = executionDetails?.pipeline_run_id;

    if (!runId) {
      notify(`Failed to cancel run. No run ID found.`, "warning");
      return;
    }

    if (!available) {
      notify(`Backend is not available. Cannot cancel run.`, "warning");
      return;
    }

    cancelRun(runId);
  }, [executionDetails?.pipeline_run_id, available, cancelRun, notify]);

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

  const refetch = useCallback(async () => {
    setIsPolling(true);
    await fetchRunMetadata();
  }, [fetchRunMetadata]);

  // Combine errors
  useEffect(() => {
    if (executionError) {
      setError(executionError);
    }
  }, [executionError]);

  // TODO:
  // need to check each method that it does what I want it to
  // need to export status
  // need to remove polling and use live status and streamed logs
  // see https://github.com/Shopify/oasis-frontend/issues/171
  const value = useMemo(
    () => ({
      executionDetails,
      executionState,
      runMetadata,
      isLoading,
      isSubmitting,
      isCancelling,
      isCloning,
      error,
      rerun,
      cancel,
      clone,
      refetch,
    }),
    [
      executionDetails,
      executionState,
      runMetadata,
      isLoading,
      isSubmitting,
      isCancelling,
      isCloning,
      error,
      rerun,
      cancel,
      clone,
      refetch,
    ],
  );

  return (
    <PipelineRunContext.Provider value={value}>
      {children}
    </PipelineRunContext.Provider>
  );
};

export const usePipelineRun = () => {
  const ctx = useContext(PipelineRunContext);
  if (!ctx) {
    throw new Error("usePipelineRun must be used within PipelineRunProvider");
  }
  return ctx;
};

function getInitialName(componentSpec: ComponentSpec): string {
  const dateTime = new Date().toISOString();
  const baseName = componentSpec?.name || "Pipeline";

  return `${removeTrailingDateFromTitle(baseName)} (${dateTime})`;
}
