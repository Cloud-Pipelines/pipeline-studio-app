import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { getArgumentsFromInputs } from "@/components/shared/ReactFlow/FlowCanvas/utils/getArgumentsFromInputs";
import {
  createPipelineRun,
  savePipelineRun,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";

import type { ComponentSpec } from "./componentSpec";
import { processComponentSpec } from "./componentUtils";
import { removeTrailingDateFromTitle } from "./string";

// todo - integrate with pipelinrun(s)provider. Authorization token to be configured before passing into this method. Success method needs to refetch. Loading/error state handled by provider.
export async function submitPipelineRun(
  componentSpec: ComponentSpec,
  backendUrl: string,
  options?: {
    authorizationToken?: string;
    onSuccess?: (data: PipelineRun) => void;
    onError?: (error: Error) => void;
  },
) {
  //   const [isSubmitting, setIsSubmitting] = useState(false);
  //   const [error, setError] = useState<string | null>(null);

  const pipelineName = getInitialName(componentSpec);

  //   const submit = useCallback(
  //     async (
  //       componentSpec: ComponentSpec,
  //       options?: {
  //         onSuccess?: (data: PipelineRun) => void;
  //         onError?: (error: Error) => void;
  //       },
  //     ) => {
  // setIsSubmitting(true);
  // setError(null);

  try {
    // const authorizationRequired = isAuthorizationRequired();
    // if (authorizationRequired && !isAuthorized) {
    //   authorizationToken.current = await awaitAuthorization();
    // }

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
    //   await refetch();
    options?.onSuccess?.(responseData);

    // setIsSubmitting(false);
  } catch (e) {
    // setIsSubmitting(false);
    // setError((e as Error).message);
    options?.onError?.(e as Error);
  }
  // },
  // [
  //   pipelineName,
  //   backendUrl,
  //   refetch,
  //   isAuthorized,
  //   awaitAuthorization,
  //   isAuthorizationRequired,
  // ],
  //   );

  //   return { submit, isSubmitting, error };
}

// todo - duplicated from pipelinerunprovider
function getInitialName(componentSpec: ComponentSpec): string {
  const dateTime = new Date().toISOString();
  const baseName = componentSpec?.name || "Pipeline";

  return `${removeTrailingDateFromTitle(baseName)} (${dateTime})`;
}
