import { useNavigate } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { useCallback } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import useToastNotification from "@/hooks/useToastNotification";
import { usePipelineRun } from "@/providers/PipelineRunProvider";
import { APP_ROUTES } from "@/routes/router";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";

type RerunPipelineButtonProps = {
  componentSpec: ComponentSpec;
};

export const RerunPipelineButton = ({
  componentSpec,
}: RerunPipelineButtonProps) => {
  const { rerun, isSubmitting } = usePipelineRun();
  const navigate = useNavigate();
  const notify = useToastNotification();

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

  const handleRerun = useCallback(() => {
    rerun(componentSpec, { onSuccess, onError });
  }, [componentSpec, rerun, onSuccess, onError]);

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
