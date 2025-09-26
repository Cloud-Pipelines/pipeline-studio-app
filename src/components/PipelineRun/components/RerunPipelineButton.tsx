import { useNavigate } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { isAuthorizationRequired } from "@/components/shared/GitHubAuth/helpers";
import { useAuthLocalStorage } from "@/components/shared/GitHubAuth/useAuthLocalStorage";
import { useAwaitAuthorization } from "@/components/shared/GitHubAuth/useAwaitAuthorization";
import useToastNotification from "@/hooks/useToastNotification";
import { useBackend } from "@/providers/BackendProvider";
import { APP_ROUTES } from "@/routes/router";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";
import { submitPipelineRun } from "@/utils/submitPipeline";

type RerunPipelineButtonProps = {
  componentSpec: ComponentSpec;
};

export const RerunPipelineButton = ({
  componentSpec,
}: RerunPipelineButtonProps) => {
  const { backendUrl } = useBackend();
  const navigate = useNavigate();
  const notify = useToastNotification();

  const { awaitAuthorization, isAuthorized } = useAwaitAuthorization();
  const { getToken } = useAuthLocalStorage();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const authorizationToken = useRef<string | undefined>(getToken());

  const onSuccess = useCallback((response: PipelineRun) => {
    navigate({ to: `${APP_ROUTES.RUNS}/${response.root_execution_id}` });
  }, []);

  const onError = useCallback(
    (error: Error | string) => {
      const message = `Failed to submit pipeline. ${error instanceof Error ? error.message : String(error)}`;
      notify(message, "error");
    },
    [notify],
  );

  const handleRerun = useCallback(async () => {
    setIsSubmitting(true);
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
        onSuccess(data);
      },
      onError: (error) => {
        setIsSubmitting(false);
        onError(error);
      },
    });
  }, [
    isAuthorized,
    awaitAuthorization,
    backendUrl,
    componentSpec,
    onSuccess,
    onError,
  ]);

  return (
    <TooltipButton
      variant="outline"
      onClick={handleRerun}
      tooltip="Rerun pipeline"
      disabled={isSubmitting}
      data-testid="rerun-pipeline-button"
    >
      <RefreshCcw className="w-4 h-4" />
    </TooltipButton>
  );
};
