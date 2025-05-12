import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import localForage from "localforage";
import { AlertCircle, CheckCircle, Loader2, SendHorizonal } from "lucide-react";
import { useState } from "react";

import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import useCooldownTimer from "@/hooks/useCooldownTimer";
import useToastNotification from "@/hooks/useToastNotification";
import { APP_ROUTES } from "@/routes/router";
import { createPipelineRun } from "@/services/pipelineRunService";
import type { ComponentReference, ComponentSpec } from "@/utils/componentSpec";
import { DB_NAME, PIPELINE_RUNS_STORE_NAME } from "@/utils/constants";

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

// Process component spec recursively to load all references
const processComponentSpec = async (
  spec: ComponentSpec,
  componentCache: Map<string, ComponentSpec> = new Map(),
  onError?: (taskId: string, error: unknown) => void
): Promise<ComponentSpec> => {
  if (!spec || !spec.implementation || !("graph" in spec.implementation)) {
    return spec;
  }

  const graph = spec.implementation.graph;
  if (!graph.tasks) {
    return spec;
  }

  // Process each task
  for (const [taskId, taskObj] of Object.entries(graph.tasks)) {
    // Type guard to ensure taskObj has componentRef
    if (!taskObj || typeof taskObj !== "object" || !("componentRef" in taskObj)) {
      continue;
    }

    const task = taskObj as { componentRef: ComponentReference };

    if (!task.componentRef) {
      continue;
    }

    // If there's a URL but no spec, fetch the component
    if (task.componentRef.url && !task.componentRef.spec) {
      try {
        // Check if we already have this component in cache
        if (componentCache.has(task.componentRef.url)) {
          console.log(`Using cached component for ${taskId} from ${task.componentRef.url}`);
          task.componentRef.spec = componentCache.get(task.componentRef.url);
          continue;
        }

        console.log(`Loading component for task ${taskId} from ${task.componentRef.url}`);

        const response = await fetchWithTimeout(task.componentRef.url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch component: ${response.statusText} (${response.status})`
          );
        }

        const text = await response.text();
        task.componentRef.text = text;

        // Parse the YAML
        try {
          const loadedSpec = parseComponentYaml(text);
          task.componentRef.spec = loadedSpec;

          // Add to cache
          componentCache.set(task.componentRef.url, loadedSpec);

          // Process nested components recursively
          if (loadedSpec.implementation && "graph" in loadedSpec.implementation) {
            await processComponentSpec(loadedSpec, componentCache, onError);
          }
        } catch (yamlError: unknown) {
          console.error(`Error parsing component YAML for ${taskId}:`, yamlError);
          const errorMessage = yamlError instanceof Error ? yamlError.message : "Invalid component format";
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
      // If spec exists, process it recursively
      await processComponentSpec(task.componentRef.spec, componentCache, onError);
    }
  }

  return spec;
};

// Save pipeline run to IndexedDB
const savePipelineRun = async (
  responseData: { id: number; root_execution_id: number; created_at: string },
  pipelineName: string,
  pipelineDigest?: string
): Promise<PipelineRun> => {
  const pipelineRunsDb = localForage.createInstance({
    name: DB_NAME,
    storeName: PIPELINE_RUNS_STORE_NAME,
  });

  const pipelineRun: PipelineRun = {
    id: responseData.id,
    root_execution_id: responseData.root_execution_id,
    created_at: responseData.created_at,
    pipeline_name: pipelineName || "Untitled Pipeline",
    pipeline_digest: pipelineDigest,
  };

  await pipelineRunsDb.setItem(String(responseData.id), pipelineRun);
  return pipelineRun;
};

interface OasisSubmitterProps {
  componentSpec?: ComponentSpec;
  onSubmitComplete?: () => void;
}

interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  pipeline_name: string;
  pipeline_digest?: string;
}

const OasisSubmitter = ({
  componentSpec,
  onSubmitComplete,
}: OasisSubmitterProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const { cooldownTime, setCooldownTime } = useCooldownTimer(0);
  const notify = useToastNotification();
  const navigate = useNavigate();

  const handleError = (message: string) => {
    notify(message, "error");
  };

  const showSuccessNotification = (runId: number) => {
    const SuccessComponent = () => (
      <div className="flex flex-col gap-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Pipeline successfully submitted</span>
        </div>
        <Button onClick={() => handleViewRun(runId)} className="w-full">
          View Run
        </Button>
      </div>
    );
    notify(<SuccessComponent />, "success");
  };

  const handleViewRun = (runId: number) => {
    if (runId) {
      navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
    }
  };

  const { mutate: createPipeline } = useMutation({
    mutationFn: createPipelineRun,
    onSuccess: async (responseData) => {
      // Store the run in IndexedDB
      if (responseData.id) {
        await savePipelineRun(
          responseData,
          componentSpec?.name || "Untitled Pipeline",
          componentSpec?.metadata?.annotations?.digest as string | undefined
        );
      }

      setSubmitSuccess(true);
      setIsSubmitting(false);
      onSubmitComplete?.();

      showSuccessNotification(responseData.root_execution_id);
    },
    onError: (error) => {
      console.error("Error submitting pipeline:", error);
      handleError("Failed to submit pipeline");
      setSubmitSuccess(false);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!componentSpec) {
      handleError("No pipeline to submit");
      return;
    }

    notify("Submitting pipeline...", "info");
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setCooldownTime(3);

    try {
      // Create a deep copy of the component spec
      const specCopy = JSON.parse(JSON.stringify(componentSpec));
      const componentCache = new Map<string, ComponentSpec>();

      // Process the root component and all nested components
      const fullyLoadedSpec = await processComponentSpec(
        specCopy,
        componentCache,
        (taskId, error) => {
          // Handle component loading errors
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          handleError(`Failed to load component "${taskId}": ${errorMessage}`);
        }
      );

      const payload = {
        root_task: {
          componentRef: {
            spec: fullyLoadedSpec,
          },
        },
      };

      createPipeline(payload as BodyCreateApiPipelineRunsPost);
    } catch (error) {
      console.error("Error submitting pipeline:", error);
      handleError("Failed to submit pipeline");
      setSubmitSuccess(false);
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (cooldownTime > 0) {
      return `Run submitted (${cooldownTime}s)`;
    }
    return "Submit Run";
  };

  const isButtonDisabled =
    isSubmitting ||
    !componentSpec ||
    cooldownTime > 0 ||
    ("graph" in componentSpec.implementation &&
      Object.keys(componentSpec.implementation.graph.tasks).length === 0);

  const getButtonIcon = () => {
    if (isSubmitting) {
      return <Loader2 className="animate-spin" />;
    }
    if (submitSuccess === false && cooldownTime > 0) {
      return <AlertCircle />;
    }
    if (submitSuccess === true && cooldownTime > 0) {
      return <CheckCircle />;
    }
    return <SendHorizonal />;
  };

  return (
    <SidebarMenuButton asChild>
      <Button
        onClick={handleSubmit}
        className="w-full justify-start px-2! mb-2"
        variant="ghost"
        disabled={isButtonDisabled}
      >
        {getButtonIcon()}
        <span className="font-normal text-xs">{getButtonText()}</span>
      </Button>
    </SidebarMenuButton>
  );
};

export default OasisSubmitter;
