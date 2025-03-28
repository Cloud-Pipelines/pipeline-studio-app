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

    await pipelineRunsDb.iterate<PipelineRun, void>((run) => {
      if (run.pipeline_name === pipelineName) {
        runs.push(run);
        if (
          !latestRun ||
          new Date(run.created_at) > new Date(latestRun.created_at)
        ) {
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

export const fetchPipelineRunById = async (runId: string) => {
  try {
    const pipelineRunsDb = localForage.createInstance({
      name: "components",
      storeName: "pipeline_runs",
    });

    const run = await pipelineRunsDb.getItem<PipelineRun>(runId.toString());
    return run || null;
  } catch (error) {
    console.error("Error fetching pipeline run by ID:", error);
    return null;
  }
};
