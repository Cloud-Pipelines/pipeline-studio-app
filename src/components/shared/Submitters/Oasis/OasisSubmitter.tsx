import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Loader2, SendHorizonal } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import useCooldownTimer from "@/hooks/useCooldownTimer";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";
import { APP_ROUTES } from "@/routes/router";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";

interface OasisSubmitterProps {
  componentSpec?: ComponentSpec;
  onSubmitComplete?: () => void;
}

const OasisSubmitter = ({
  componentSpec,
  onSubmitComplete,
}: OasisSubmitterProps) => {
  const { configured, available } = useBackend();
  const { submit, isSubmitting } = usePipelineRuns();

  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const { cooldownTime, setCooldownTime } = useCooldownTimer(0);
  const notify = useToastNotification();
  const navigate = useNavigate();

  const handleError = useCallback(
    (message: string) => {
      notify(message, "error");
    },
    [notify],
  );

  const handleViewRun = useCallback(
    (runId: number) => {
      if (runId) {
        navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
      }
    },
    [navigate],
  );

  const showSuccessNotification = useCallback(
    (runId: number) => {
      const SuccessComponent = () => (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Pipeline successfully submitted
            </span>
          </div>
          <Button onClick={() => handleViewRun(runId)} className="w-full">
            View Run
          </Button>
        </div>
      );
      notify(<SuccessComponent />, "success");
    },
    [notify, handleViewRun],
  );

  const onSuccess = useCallback(
    (response: PipelineRun) => {
      setSubmitSuccess(true);
      setCooldownTime(3);
      onSubmitComplete?.();
      showSuccessNotification(response.root_execution_id);
    },
    [setCooldownTime, onSubmitComplete, showSuccessNotification],
  );

  const onError = useCallback(
    (error: Error | string) => {
      if (error instanceof Error) {
        handleError(`Failed to submit pipeline. ${error.message}`);
      } else {
        handleError(`Failed to submit pipeline. ${String(error)}`);
      }
      setSubmitSuccess(false);
      setCooldownTime(3);
    },
    [handleError, setCooldownTime],
  );

  const handleSubmit = useCallback(async () => {
    if (!componentSpec) {
      handleError("No pipeline to submit");
      return;
    }

    setSubmitSuccess(null);
    submit(componentSpec, { onSuccess, onError });
  }, [handleError, submit, componentSpec, onSuccess, onError]);

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
    <SidebarMenuButton
      asChild
      tooltip="Submit Run"
      forceTooltip
      tooltipPosition="right"
    >
      <Button
        onClick={handleSubmit}
        className="w-full justify-start"
        variant="ghost"
        disabled={isButtonDisabled || !available}
      >
        {getButtonIcon()}
        <span className="font-normal text-xs">{getButtonText()}</span>
        {!available && (
          <div
            className={cn(
              "text-xs font-light -ml-1",
              configured ? "text-red-700" : "text-yellow-700",
            )}
          >
            {`(backend ${configured ? "unavailable" : "unconfigured"})`}
          </div>
        )}
      </Button>
    </SidebarMenuButton>
  );
};

export default OasisSubmitter;
