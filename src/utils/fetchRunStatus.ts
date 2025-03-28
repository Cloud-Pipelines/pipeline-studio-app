import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import {
  countTaskStatuses,
  getRunStatus,
} from "@/components/PipelineRow/utils";

import { API_URL } from "./constants";

export const fetchRunStatus = async (runId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/executions/${runId}/details`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`,
      );
    }
    const details: GetExecutionInfoResponse = await response.json();

    const stateResponse = await fetch(
      `${API_URL}/api/executions/${runId}/state`,
    );
    if (!stateResponse.ok) {
      throw new Error(
        `Failed to fetch execution state: ${stateResponse.statusText}`,
      );
    }
    const stateData: GetGraphExecutionStateResponse =
      await stateResponse.json();

    return getRunStatus(countTaskStatuses(details, stateData));
  } catch (error) {
    console.error(`Error fetching task statuses for run ${runId}:`, error);
  }
};
