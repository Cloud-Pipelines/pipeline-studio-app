import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import {
  countTaskStatuses,
  getRunStatus,
} from "@/components/shared/Status/utils";

import { API_URL } from "./constants";

export const fetchExecutionStatus = async (executionId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/api/executions/${executionId}/details`,
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch execution details: ${response.statusText}`,
      );
    }
    const details: GetExecutionInfoResponse = await response.json();

    const stateResponse = await fetch(
      `${API_URL}/api/executions/${executionId}/state`,
    );
    if (!stateResponse.ok) {
      throw new Error(
        `Failed to fetch execution state: ${stateResponse.statusText}`,
      );
    }
    const stateData: GetGraphExecutionStateResponse =
      await stateResponse.json();

    const taskStatuses = countTaskStatuses(details, stateData);
    const runStatus = getRunStatus(taskStatuses);

    return runStatus;
  } catch (error) {
    console.error(
      `Error fetching task statuses for run ${executionId}:`,
      error,
    );
  }
};
