import { useQuery } from "@tanstack/react-query";

import { useBackend } from "@/providers/BackendProvider";
import {
  fetchExecutionDetails,
  fetchExecutionState,
  fetchPipelineRun,
} from "@/services/executionService";

async function fetchPipelineExecutionInfo(
  rootExecutionId: string,
  backendUrl: string,
) {
  const data = await Promise.all([
    fetchExecutionDetails(rootExecutionId, backendUrl),
    fetchExecutionState(rootExecutionId, backendUrl),
  ]).catch((_) => undefined);

  if (data) {
    return {
      rootExecutionId,
      details: data[0],
      state: data[1],
    };
  }

  return undefined;
}

/* Accepts root_execution_id or run_id and returns execution details and state */
export const usePipelineRunData = (id: string) => {
  const { backendUrl } = useBackend();

  const {
    data: executionData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["pipeline-run", id],
    queryFn: async () => {
      // id is run_id
      const executionDetailsDerivedFromRun = await fetchPipelineRun(
        id,
        backendUrl,
      )
        .then((res) =>
          fetchPipelineExecutionInfo(res.root_execution_id, backendUrl),
        )
        .catch((_) => undefined);

      if (executionDetailsDerivedFromRun?.rootExecutionId) {
        return executionDetailsDerivedFromRun;
      }

      // id is root_execution_id
      const executionDetailsDerivedFromExecution =
        await fetchPipelineExecutionInfo(id, backendUrl).catch(
          (_) => undefined,
        );

      if (executionDetailsDerivedFromExecution?.rootExecutionId) {
        return executionDetailsDerivedFromExecution;
      }

      throw new Error("No pipeline run or execution details found");
    },
  });

  return {
    executionData,
    rootExecutionId: executionData?.rootExecutionId ?? "",
    isLoading,
    error,
  };
};
