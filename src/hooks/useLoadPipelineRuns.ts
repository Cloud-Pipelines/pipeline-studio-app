import { useCallback, useEffect, useState } from "react";

import { fetchExecutionStatus } from "@/services/executionService";
import { fetchPipelineRuns } from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";

const useLoadPipelineRuns = (pipelineName: string, backendUrl: string) => {
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);

  const fetchData = useCallback(async () => {
    if (!pipelineName) return;

    const res = await fetchPipelineRuns(pipelineName);

    if (!res) return;

    if (res.latestRun) {
      const latestRun = res.latestRun as PipelineRun;

      latestRun.status = await fetchExecutionStatus(
        `${latestRun.root_execution_id}`,
        backendUrl,
      );

      setLatestRun(latestRun);
    }

    setPipelineRuns(res.runs);
  }, [backendUrl, pipelineName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { pipelineRuns, latestRun, refetch: fetchData };
};

export default useLoadPipelineRuns;
