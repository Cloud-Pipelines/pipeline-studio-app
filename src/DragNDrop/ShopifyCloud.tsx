import { useState } from "react";
import mockFetch from "@/utils/mockAPI";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "@/utils/constants";
import type { ComponentSpec } from "../componentSpec";
import localForage from "localforage";

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

const ShopifyCloudSubmitter = ({
  componentSpec,
}: ShopifyCloudSubmitterProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

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
      const payload = {
        name: componentSpec.name || "Untitled Pipeline",
        pipeline_spec: {
          component_spec: componentSpec,
        },
      };
      const response = await mockFetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/pipeline_runs/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      // Store the run in IndexedDB
      if (data.id) {
        // Initialize the pipeline runs store
        const pipelineRunsDb = localForage.createInstance({
          name: DB_NAME,
          storeName: PIPELINE_RUNS_STORE_NAME,
        });

        // Create a run entry
        const pipelineRun: PipelineRun = {
          id: data.id,
          root_execution_id: data.root_execution_id,
          created_at: data.created_at,
          pipeline_name: componentSpec.name || "Untitled Pipeline",
          pipeline_digest: componentSpec.metadata?.annotations?.digest as
            | string
            | undefined,
        };

        await pipelineRunsDb.setItem(data.id, pipelineRun);
      }

      setSubmitSuccess(true);

      // Navigate to the runs page after a short delay
      setTimeout(() => {
        navigate({
          to: `${APP_ROUTES.RUNS}/${data.id}`,
        });
      }, 1500);
    } catch (error) {
      console.error("Error submitting pipeline:", error);
      setErrorMessage("Failed to submit pipeline");
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's no backend API URL configured, don't render anything
  if (!import.meta.env.VITE_BACKEND_API_URL) {
    return null;
  }

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
        <div className="flex items-center text-green-600 text-sm mt-1">
          <CheckCircle className="h-4 w-4 mr-1" />
          Pipeline submitted successfully!
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
