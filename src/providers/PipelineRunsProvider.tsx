import yaml from "js-yaml";
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

import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { GitHubAuthFlowBackdrop } from "@/components/shared/GitHubAuth/GitHubAuthFlowBackdrop";
import { isAuthorizationRequired } from "@/components/shared/GitHubAuth/helpers";
import { useAuthLocalStorage } from "@/components/shared/GitHubAuth/useAuthLocalStorage";
import { useAwaitAuthorization } from "@/components/shared/GitHubAuth/useAwaitAuthorization";
import { getArgumentsFromInputs } from "@/components/shared/ReactFlow/FlowCanvas/utils/getArgumentsFromInputs";
import {
  countTaskStatuses,
  fetchExecutionDetails,
  fetchExecutionState,
  getRunStatus,
} from "@/services/executionService";
import {
  createPipelineRun,
  fetchPipelineRuns,
  savePipelineRun,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import {
  type ComponentReference,
  type ComponentSpec,
} from "@/utils/componentSpec";

import { useBackend } from "./BackendProvider";

type PipelineRunsContextType = {
  runs: PipelineRun[];
  recentRuns: PipelineRun[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submit: (
    componentSpec: ComponentSpec,
    options: {
      onSuccess: (data: PipelineRun) => void;
      onError: (error: Error | string) => void;
    },
  ) => Promise<void>;
  setRecentRunsCount: (count: number) => void;
};

const PipelineRunsContext = createContext<PipelineRunsContextType | undefined>(
  undefined,
);

const DEFAULT_RECENT_RUNS = 4;

export const PipelineRunsProvider = ({
  pipelineName,
  children,
}: {
  pipelineName: string;
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

  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [recentRuns, setRecentRuns] = useState<PipelineRun[]>([]);
  const [recentRunsCount, setRecentRunsCount] = useState(DEFAULT_RECENT_RUNS);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorizationToken = useRef<string | undefined>(getToken());

  const refetch = useCallback(async () => {
    if (!configured || !available) {
      setRuns([]);
      setRecentRuns([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchPipelineRuns(pipelineName);

      if (!res || !res.runs) {
        setRuns([]);
        setRecentRuns([]);
        setIsLoading(false);
        return;
      }

      const recent = res.runs.slice(0, recentRunsCount).map(async (run) => {
        try {
          const state = await fetchExecutionState(
            run.root_execution_id.toString(),
            backendUrl,
          );

          const details = await fetchExecutionDetails(
            run.root_execution_id.toString(),
            backendUrl,
          );

          if (details && state) {
            run.statusCounts = countTaskStatuses(details, state);
            run.status = getRunStatus(run.statusCounts);
          }

          return run;
        } catch (e) {
          console.error(`Error fetching details for Run ${run.id}:`, e);
          return run;
        }
      });

      setRecentRuns((await Promise.all(recent)) as PipelineRun[]);

      setRuns(res.runs);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setError((e as Error).message);
    }
  }, [pipelineName, backendUrl, configured, available, recentRunsCount]);

  const submit = useCallback(
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
          authorizationToken.current = await awaitAuthorization();
        }

        const specCopy = structuredClone(componentSpec);
        const componentCache = new Map<string, ComponentSpec>();
        const fullyLoadedSpec = await processComponentSpec(
          specCopy,
          componentCache,
          (_taskId, error) => {
            options?.onError?.(error as Error);
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

        if (responseData.id) {
          await savePipelineRun(
            responseData,
            pipelineName,
            componentSpec.metadata?.annotations?.digest as string | undefined,
          );
        }
        await refetch();
        options?.onSuccess?.(responseData);

        setIsSubmitting(false);
      } catch (e) {
        setIsSubmitting(false);
        setError((e as Error).message);
        options?.onError?.(e as Error);
      }
    },
    [pipelineName, backendUrl, refetch, isAuthorized, awaitAuthorization],
  );

  useEffect(() => {
    if (pipelineName) refetch();
  }, [pipelineName, backendUrl, refetch]);

  const value = useMemo(
    () => ({
      runs,
      recentRuns,
      isLoading,
      isSubmitting,
      error,
      refetch,
      submit,
      setRecentRunsCount,
    }),
    [runs, recentRuns, isLoading, isSubmitting, error, refetch, submit],
  );

  return (
    <PipelineRunsContext.Provider value={value}>
      {children}
      <GitHubAuthFlowBackdrop
        isOpen={isPopupOpen}
        onClose={closePopup}
        onClick={bringPopupToFront}
      />
    </PipelineRunsContext.Provider>
  );
};

export const usePipelineRuns = () => {
  const ctx = useContext(PipelineRunsContext);
  if (!ctx)
    throw new Error("usePipelineRuns must be used within PipelineRunsProvider");
  return ctx;
};

// Fetch component with timeout to avoid hanging on unresponsive URLs
const fetchWithTimeout = async (url: string, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Load component from text and parse YAML
const parseComponentYaml = (text: string): ComponentSpec => {
  if (!text || text.trim() === "") {
    throw new Error("Received empty component specification");
  }

  const loadedSpec = yaml.load(text) as ComponentSpec;

  if (!loadedSpec || typeof loadedSpec !== "object") {
    throw new Error("Invalid component specification format");
  }

  return loadedSpec;
};

const processComponentSpec = async (
  spec: ComponentSpec,
  componentCache: Map<string, ComponentSpec> = new Map(),
  onError?: (taskId: string, error: unknown) => void,
): Promise<ComponentSpec> => {
  if (!spec || !spec.implementation || !("graph" in spec.implementation)) {
    return spec;
  }

  const graph = spec.implementation.graph;
  if (!graph.tasks) {
    return spec;
  }

  for (const [taskId, taskObj] of Object.entries(graph.tasks)) {
    if (
      !taskObj ||
      typeof taskObj !== "object" ||
      !("componentRef" in taskObj)
    ) {
      continue;
    }

    const task = taskObj as { componentRef: ComponentReference };

    if (!task.componentRef) {
      continue;
    }

    // If there's a URL but no spec, fetch the component
    if (task.componentRef.url && !task.componentRef.spec) {
      try {
        if (componentCache.has(task.componentRef.url)) {
          task.componentRef.spec = componentCache.get(task.componentRef.url);
          continue;
        }

        const response = await fetchWithTimeout(task.componentRef.url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch component: ${response.statusText} (${response.status})`,
          );
        }

        const text = await response.text();
        task.componentRef.text = text;

        try {
          const loadedSpec = parseComponentYaml(text);
          task.componentRef.spec = loadedSpec;

          componentCache.set(task.componentRef.url, loadedSpec);

          if (
            loadedSpec.implementation &&
            "graph" in loadedSpec.implementation
          ) {
            await processComponentSpec(loadedSpec, componentCache, onError);
          }
        } catch (yamlError: unknown) {
          console.error(
            `Error parsing component YAML for ${taskId}:`,
            yamlError,
          );
          const errorMessage =
            yamlError instanceof Error
              ? yamlError.message
              : "Invalid component format";
          throw new Error(`Invalid component format: ${errorMessage}`);
        }
      } catch (error: unknown) {
        console.error(`Error loading component for task ${taskId}:`, error);

        if (onError) {
          onError(taskId, error);
        }

        throw error;
      }
    } else if (task.componentRef.spec) {
      await processComponentSpec(
        task.componentRef.spec,
        componentCache,
        onError,
      );
    }
  }

  return spec;
};
