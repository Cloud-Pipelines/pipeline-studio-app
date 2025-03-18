import { type PipelineRun, type TaskStatusCounts } from "./types";

export const USE_MOCK_DATA = false;

/**
 * Generates mock pipeline runs data for testing
 */
export const generateMockData = (pipelineName: string) => {
  const mockRuns: PipelineRun[] = [
    {
      id: 1001,
      root_execution_id: 1001,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      pipeline_name: pipelineName,
      status: "SUCCEEDED",
    },
    {
      id: 1002,
      root_execution_id: 1002,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      pipeline_name: pipelineName,
      status: "FAILED",
    },
    {
      id: 1003,
      root_execution_id: 1003,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      pipeline_name: pipelineName,
      status: "RUNNING",
    },
  ];

  const mockTaskStatuses: Record<number, TaskStatusCounts> = {
    1001: { total: 10, succeeded: 8, failed: 0, running: 1, pending: 1 },
    1002: { total: 12, succeeded: 8, failed: 4, running: 0, pending: 0 },
    1003: { total: 8, succeeded: 3, failed: 1, running: 2, pending: 2 },
  };

  return { mockRuns, mockTaskStatuses };
};
