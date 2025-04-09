import type { BodyCreateApiPipelineRunsPost } from "@/api/types.gen";

import { API_URL } from "./constants";

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

export default createPipelineRun;
