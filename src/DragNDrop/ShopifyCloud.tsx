import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "@/utils/constants";
import type { ComponentSpec } from "../componentSpec";
import localForage from "localforage";
import { useMutation } from "@tanstack/react-query";

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

const createPipelineRun = async (payload: any) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/pipeline_runs/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

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
  const navigate = useNavigate();

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

    try {
      // Transform the componentSpec into the format expected by the API
      const payload = {
        root_task: {
          componentRef: {
            spec: componentSpec,
          },
        },
      };

      createPipeline(payload);
    } catch (error) {
      console.error("Error submitting pipeline:", error);
      setErrorMessage("Failed to submit pipeline");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !componentSpec}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
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
