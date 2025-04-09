import { useEffect, useState } from "react";

import { fetchExecutionStatus } from "@/utils/fetchExecutionStatus";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

const useLoadPipelineRuns = (pipelineName: string) => {
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);

  const fetchData = async () => {
    if (!pipelineName) return;

    const res = await fetchPipelineRuns(pipelineName);

    if (!res) return;

    if (res.latestRun) {
      const latestRun = res.latestRun as PipelineRun;

      latestRun.status = await fetchExecutionStatus(
        `${latestRun.root_execution_id}`,
      );

      setLatestRun(latestRun);
    }

    setPipelineRuns(res.runs);
  };

  useEffect(() => {
    fetchData();
  }, [pipelineName]);

  return { pipelineRuns, latestRun, refetch: fetchData };
};

export default useLoadPipelineRuns;
