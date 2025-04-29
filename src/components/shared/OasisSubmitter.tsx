import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import type { ComponentSpec } from "@/utils/componentSpec";
import { DB_NAME, PIPELINE_RUNS_STORE_NAME } from "@/utils/constants";

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
        // Initialize the pipeline runs store
        const pipelineRunsDb = localForage.createInstance({
          name: DB_NAME,
          storeName: PIPELINE_RUNS_STORE_NAME,
        });

        // Create a run entry
        const pipelineRun: PipelineRun = {
          id: responseData.id,
          root_execution_id: responseData.root_execution_id,
          created_at: responseData.created_at,
          pipeline_name: componentSpec?.name || "Untitled Pipeline",
          pipeline_digest: componentSpec?.metadata?.annotations?.digest as
            | string
            | undefined,
        };

        await pipelineRunsDb.setItem(responseData.id, pipelineRun);
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
      const payload = {
        root_task: {
          componentRef: {
            spec: componentSpec,
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
        className="w-full justify-start px-2! cursor-pointer mb-2"
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
