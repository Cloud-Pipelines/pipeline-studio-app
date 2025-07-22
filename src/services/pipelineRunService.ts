import localForage from "localforage";

import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";
import { APP_ROUTES } from "@/routes/router";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";
import {
  componentSpecToYaml,
  getComponentFileFromList,
  writeComponentToFileListFromText,
} from "@/utils/componentStore";
import {
  DB_NAME,
  PIPELINE_RUNS_STORE_NAME,
  USER_PIPELINES_LIST_NAME,
} from "@/utils/constants";

export const createPipelineRun = async (
  payload: BodyCreateApiPipelineRunsPost,
  backendUrl: string,
  authorizationToken?: string,
) => {
  const authorizationHeader = authorizationToken
    ? { Authorization: `Bearer ${authorizationToken}` }
    : undefined;

  const response = await fetch(`${backendUrl}/api/pipeline_runs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authorizationHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create pipeline run");
  }

  return response.json();
};

export const savePipelineRun = async (
  responseData: {
    id: number;
    root_execution_id: number;
    created_at: string;
    created_by: string;
  },
  pipelineName: string,
  pipelineDigest?: string,
): Promise<PipelineRun> => {
  const pipelineRunsDb = localForage.createInstance({
    name: DB_NAME,
    storeName: PIPELINE_RUNS_STORE_NAME,
  });

  const pipelineRun: PipelineRun = {
    id: responseData.id,
    root_execution_id: responseData.root_execution_id,
    created_at: responseData.created_at,
    created_by: responseData.created_by,
    pipeline_name: pipelineName || "Untitled Pipeline",
    pipeline_digest: pipelineDigest,
  };

  await pipelineRunsDb.setItem(String(responseData.id), pipelineRun);
  return pipelineRun;
};

export const copyRunToPipeline = async (
  componentSpec: ComponentSpec,
  name?: string,
) => {
  if (!componentSpec) {
    console.error("No component spec found to copy");
    return {
      url: null,
      name: null,
    };
  }

  try {
    const cleanComponentSpec = structuredClone(componentSpec);

    if (
      "graph" in cleanComponentSpec.implementation &&
      cleanComponentSpec.implementation?.graph?.tasks
    ) {
      Object.values(cleanComponentSpec.implementation.graph.tasks).forEach(
        (task: any) => {
          if (task.annotations && "status" in task.annotations) {
            delete task.annotations.status;
          }
        },
      );
    }
    // The editor now only supports left-to-right layouts direction, so we mark every cloned pipelines with this annotation.
    // Ideally, we should have tried to properly convert the pipelines (transpose the node positions).
    // But there are already many runs that are left-to-right but not marked as such.
    cleanComponentSpec.metadata ??= {};
    cleanComponentSpec.metadata.annotations ??= {};
    cleanComponentSpec.metadata.annotations["editor.flow-direction"] ??=
      "left-to-right";

    // Generate a name for the copied pipeline
    const originalName = cleanComponentSpec.name || "Unnamed Pipeline";
    let newName = name || originalName;

    // Check if the name already exists and append a number if needed
    let nameExists = true;
    let counter = 1;

    while (nameExists) {
      const existingFile = await getComponentFileFromList(
        USER_PIPELINES_LIST_NAME,
        newName,
      );

      if (existingFile === null) {
        nameExists = false;
      } else {
        const countNumber = counter > 1 ? " " + counter : "";
        newName = `${originalName} (Copy${countNumber})`;
        counter++;
      }
    }

    cleanComponentSpec.name = newName;

    const componentText = componentSpecToYaml(cleanComponentSpec);
    await writeComponentToFileListFromText(
      USER_PIPELINES_LIST_NAME,
      newName,
      componentText,
    );

    const urlName = encodeURIComponent(newName);

    return {
      url: APP_ROUTES.PIPELINE_EDITOR.replace("$name", urlName),
      name: newName,
    };
  } catch (error) {
    console.error("Error cloning pipeline:", error);
    return {
      url: null,
      name: null,
    };
  }
};

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

    const run = (await pipelineRunsDb.getItem(runId.toString())) as PipelineRun;
    return run;
  } catch (error) {
    console.error("Error fetching pipeline run by ID:", error);
    return null;
  }
};

export const cancelPipelineRun = async (runId: string, backendUrl: string) => {
  const response = await fetch(
    `${backendUrl}/api/pipeline_runs/${runId}/cancel`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to cancel pipeline run");
  }

  // endpoint returns nothing
};
