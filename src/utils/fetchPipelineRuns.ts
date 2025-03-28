import localForage from "localforage";

export interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  created_by: string;
  pipeline_name: string;
  pipeline_digest?: string;
  status?: string;
}

export const fetchPipelineRuns = async (pipelineName: string) => {
  try {
    const pipelineRunsDb = localForage.createInstance({
      name: "components",
      storeName: "pipeline_runs",
    });

    const runs: PipelineRun[] = [];
    let latestRun: PipelineRun | null = null;
    let latestDate = new Date(0);

    await pipelineRunsDb.iterate<PipelineRun, void>((run) => {
      if (run.pipeline_name === pipelineName) {
        runs.push(run);
        const runDate = new Date(run.created_at);
        if (runDate > latestDate) {
          latestDate = runDate;
          latestRun = run;
        }
      }
    });

    runs.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return { runs, latestRun };
  } catch (error) {
    console.error("Error fetching pipeline runs:", error);
  }
};
