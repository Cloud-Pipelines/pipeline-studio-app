import { useMutation } from "@tanstack/react-query";
import yaml from "js-yaml";
import { useState } from "react";

import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { createPipelineRun } from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentReference, ComponentSpec } from "@/utils/componentSpec";

export function usePipelineRunSubmitter(
  componentSpec?: ComponentSpec,
  options?: {
    onSuccess?: (data: PipelineRun) => void;
    onError?: (error: Error | string) => void;
  },
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);

  const {
    mutate: createPipeline,
    error,
    data,
  } = useMutation({
    mutationFn: createPipelineRun,
    onSuccess: (responseData) => {
      setSubmitSuccess(true);
      setIsSubmitting(false);
      options?.onSuccess?.(responseData);
    },
    onError: (error) => {
      setSubmitSuccess(false);
      setIsSubmitting(false);
      options?.onError?.(error);
    },
  });

  const submitPipelineRun = async () => {
    if (!componentSpec) {
      setSubmitSuccess(false);
      options?.onError?.("No pipeline to submit");
      return;
    }
    setIsSubmitting(true);
    setSubmitSuccess(null);

    try {
      const specCopy = structuredClone(componentSpec);
      const componentCache = new Map<string, ComponentSpec>();
      const fullyLoadedSpec = await processComponentSpec(
        specCopy,
        componentCache,
        (_taskId, error) => {
          options?.onError?.(error as Error);
        },
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
      setSubmitSuccess(false);
      setIsSubmitting(false);
      options?.onError?.(error as Error);
    }
  };

  return {
    submitPipelineRun,
    isSubmitting,
    submitSuccess,
    error,
    data,
  };
}

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
