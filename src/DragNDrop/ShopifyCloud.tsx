import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import localForage from "localforage";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { Button } from "@/components/ui/button";
import { API_URL, APP_ROUTES } from "@/utils/constants";

import type { ComponentSpec } from "../componentSpec";

interface ShopifyCloudSubmitterProps {
  componentSpec?: ComponentSpec;
}

// IndexedDB constants
const DB_NAME = "components";
const PIPELINE_RUNS_STORE_NAME = "pipeline_runs";

interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  pipeline_name: string;
  pipeline_digest?: string;
}

const createPipelineRun = async (payload: BodyCreateApiPipelineRunsPost) => {
  const response = await fetch(`${API_URL}/api/pipeline_runs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create pipeline run");
  }

  return response.json();
};

const ShopifyCloudSubmitter = ({
  componentSpec,
}: ShopifyCloudSubmitterProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownTime]);

  // Inside your component
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

      setRunId(responseData.root_execution_id);
    },
    onError: (error) => {
      console.error("Error submitting pipeline:", error);
      setErrorMessage("Failed to submit pipeline");
      setSubmitSuccess(false);
    },
  });

  const handleViewRun = () => {
    if (runId) {
      navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
    }
  };

  const handleSubmit = async () => {
    if (!componentSpec) {
      setErrorMessage("No pipeline to submit");
      setSubmitSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(null);
    setErrorMessage(null);
    setCooldownTime(3);

    try {
      // Transform the componentSpec into the format expected by the API
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
      setErrorMessage("Failed to submit pipeline");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled =
    isSubmitting ||
    !componentSpec ||
    cooldownTime > 0 ||
    ("graph" in componentSpec.implementation &&
      Object.keys(componentSpec.implementation.graph.tasks).length === 0);

  return (
    <div className="flex flex-col gap-2 p-2">
      <Button
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className="w-full relative"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : cooldownTime > 0 ? (
          <>Submit Run ({cooldownTime}s)</>
        ) : (
          "Submit Run"
        )}
      </Button>

      {submitSuccess === true && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center text-green-600 text-sm mt-1">
            <CheckCircle className="h-4 w-4 mr-1" />
            Pipeline submitted successfully!
          </div>
          <Button
            onClick={handleViewRun}
            variant="outline"
            className="cursor-pointer"
          >
            View Run
          </Button>
        </div>
      )}

      {submitSuccess === false && (
        <div className="flex items-center text-red-600 text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errorMessage || "Failed to submit pipeline"}
        </div>
      )}
    </div>
  );
};

export default ShopifyCloudSubmitter;
