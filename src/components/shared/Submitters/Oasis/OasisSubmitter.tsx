import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Loader2, SendHorizonal } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { Button } from "@/components/ui/button";
import { BlockStack } from "@/components/ui/layout";
import {
  type NotificationType,
  PopupNotification,
} from "@/components/ui/popupnotification";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Paragraph } from "@/components/ui/typography";
import useCooldownTimer from "@/hooks/useCooldownTimer";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";
import { APP_ROUTES } from "@/routes/router";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";
import { checkComponentSpecValidity } from "@/utils/validations";

interface OasisSubmitterProps {
  componentSpec?: ComponentSpec;
  onSubmitComplete?: () => void;
}

const timeout = 1000 * 3; // 3 seconds

const OasisSubmitter = ({
  componentSpec,
  onSubmitComplete,
}: OasisSubmitterProps) => {
  const { configured, available } = useBackend();
  const { submit, isSubmitting } = usePipelineRuns();
  const isAutoRedirect = useBetaFlagValue("redirect-on-new-pipeline-run");
  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const { cooldownTime, setCooldownTime } = useCooldownTimer(0);
  const [notification, setNotification] = useState<{
    content: React.ReactNode;
    type: NotificationType;
  } | null>(null);

  const handleError = useCallback((message: string) => {
    setNotification({
      content: <div className="text-sm text-red-700">{message}</div>,
      type: "error",
    });
    setTimeout(() => setNotification(null), timeout);
  }, []);

  const handleViewRun = useCallback(
    (runId: number, newTab = false) => {
      const href = `${APP_ROUTES.RUNS}/${runId}`;
      if (newTab) {
        window.open(href, "_blank");
      } else {
        navigate({ to: href });
      }
    },
    [navigate],
  );

  const showSuccessNotification = useCallback(
    (runId: number) => {
      const SuccessComponent = () => (
        <BlockStack gap="1">
          <Paragraph size="xs">Pipeline successfully submitted</Paragraph>
          <Button
            onClick={() => handleViewRun(runId)}
            className="w-full"
            size="xs"
          >
            View Run
          </Button>
        </BlockStack>
      );

      setNotification({
        content: <SuccessComponent />,
        type: "success",
      });
      setTimeout(() => setNotification(null), timeout);
    },
    [handleViewRun],
  );

  const onSuccess = useCallback(
    (response: PipelineRun) => {
      setSubmitSuccess(true);
      setCooldownTime(3);
      onSubmitComplete?.();
      showSuccessNotification(response.root_execution_id);

      if (isAutoRedirect) {
        handleViewRun(response.root_execution_id, true);
      }
    },
    [
      setCooldownTime,
      onSubmitComplete,
      showSuccessNotification,
      isAutoRedirect,
      handleViewRun,
    ],
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

    const { isValid } = checkComponentSpecValidity(componentSpec);

    if (!isValid) {
      handleError(
        `Pipeline validation failed. Refer to details panel for more info.`,
      );
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
    <div className="relative">
      <SidebarMenuButton
        asChild
        tooltip="Submit Run"
        forceTooltip
        tooltipPosition="right"
      >
        <Button
          ref={buttonRef}
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

      <PopupNotification
        isOpen={!!notification}
        onClose={() => setNotification(null)}
        triggerRef={buttonRef}
        content={notification?.content}
        type={notification?.type || "success"}
        position="right"
      />
    </div>
  );
};

export default OasisSubmitter;
