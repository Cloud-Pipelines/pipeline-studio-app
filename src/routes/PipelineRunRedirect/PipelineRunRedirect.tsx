import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { InfoBox } from "@/components/shared/InfoBox";
import { Spinner } from "@/components/ui/spinner";
import { useBackend } from "@/providers/BackendProvider";
import {
  APP_ROUTES,
  type PipelineRunRedirectParams,
  pipelineRunRedirectRoute,
} from "@/routes/router";
import { useFetchPipelineRun } from "@/services/executionService";
import { getBackendStatusString } from "@/utils/backend";

const PipelineRunRedirect = () => {
  const navigate = useNavigate();
  const { backendUrl, configured, available } = useBackend();
  const { id: pipelineRunId } =
    pipelineRunRedirectRoute.useParams() as PipelineRunRedirectParams;

  const { data, isLoading, error } = useFetchPipelineRun(
    pipelineRunId,
    backendUrl,
  );

  useEffect(() => {
    if (data?.root_execution_id) {
      // Redirect to the execution view
      navigate({
        to: `${APP_ROUTES.RUNS}/${data.root_execution_id}`,
        replace: true, // Replace the current history entry
      });
    }
  }, [data, navigate]);

  if (!configured) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <InfoBox title="Backend not configured" variant="warning">
          Configure a backend to view this pipeline run.
        </InfoBox>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <Spinner /> Loading Pipeline Run...
      </div>
    );
  }

  if (error) {
    const backendStatusString = getBackendStatusString(configured, available);
    return (
      <div className="flex items-center justify-center h-full w-full gap-2">
        <InfoBox title="Error loading pipeline run" variant="error">
          <div className="mb-2">{error.message}</div>
          <div className="text-black italic">{backendStatusString}</div>
        </InfoBox>
      </div>
    );
  }

  // This should not be reached if everything works correctly
  // as the redirect happens in useEffect
  return (
    <div className="flex items-center justify-center h-full w-full gap-2">
      <Spinner /> Redirecting to execution view...
    </div>
  );
};

export default PipelineRunRedirect;
