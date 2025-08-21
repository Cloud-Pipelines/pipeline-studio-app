import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { getArgumentsFromInputs } from "@/components/shared/ReactFlow/FlowCanvas/utils/getArgumentsFromInputs";
import {
  createPipelineRun,
  savePipelineRun,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";

import type { ComponentSpec } from "./componentSpec";
import { processComponentSpec } from "./componentUtils";
import { getInitialName } from "./getComponentName";

export async function submitPipelineRun(
  componentSpec: ComponentSpec,
  backendUrl: string,
  options?: {
    authorizationToken?: string;
    onSuccess?: (data: PipelineRun) => void;
    onError?: (error: Error) => void;
  },
) {
  const pipelineName = getInitialName(componentSpec);

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
      options?.authorizationToken,
    );

    if (responseData.id) {
      await savePipelineRun(
        responseData,
        pipelineName,
        componentSpec.metadata?.annotations?.digest as string | undefined,
      );
    }
    options?.onSuccess?.(responseData);
  } catch (e) {
    options?.onError?.(e as Error);
  }
}
