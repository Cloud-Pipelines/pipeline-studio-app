import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { PipelineRunResponse } from "@/api/types.gen";
import type { TaskStatusCounts } from "@/types/pipelineRun";

import { fetchPipelineRun, getRunStatus, STATUS } from "./executionService";

describe("getRunStatus()", () => {
  it("should return CANCELLED when there are cancelled tasks", () => {
    const statusData: TaskStatusCounts = {
      total: 5,
      succeeded: 2,
      failed: 1,
      running: 1,
      waiting: 0,
      skipped: 0,
      cancelled: 1,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.CANCELLED);
  });

  it("should return FAILED when there are failed tasks but no cancelled tasks", () => {
    const statusData: TaskStatusCounts = {
      total: 4,
      succeeded: 1,
      failed: 2,
      running: 1,
      waiting: 0,
      skipped: 0,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.FAILED);
  });

  it("should return RUNNING when there are running tasks but no cancelled or failed tasks", () => {
    const statusData: TaskStatusCounts = {
      total: 4,
      succeeded: 1,
      failed: 0,
      running: 2,
      waiting: 1,
      skipped: 0,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.RUNNING);
  });

  it("should return WAITING when there are waiting tasks but no cancelled, failed, or running tasks", () => {
    const statusData: TaskStatusCounts = {
      total: 3,
      succeeded: 1,
      failed: 0,
      running: 0,
      waiting: 2,
      skipped: 0,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.WAITING);
  });

  it("should return SUCCEEDED when there are succeeded tasks but no other active/problematic tasks", () => {
    const statusData: TaskStatusCounts = {
      total: 3,
      succeeded: 2,
      failed: 0,
      running: 0,
      waiting: 0,
      skipped: 1,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.SUCCEEDED);
  });

  it("should return UNKNOWN when all task counts are zero", () => {
    const statusData: TaskStatusCounts = {
      total: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      waiting: 0,
      skipped: 0,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.UNKNOWN);
  });

  it("should return UNKNOWN when only skipped tasks exist", () => {
    const statusData: TaskStatusCounts = {
      total: 2,
      succeeded: 0,
      failed: 0,
      running: 0,
      waiting: 0,
      skipped: 2,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.UNKNOWN);
  });

  it("should prioritize CANCELLED over all other statuses", () => {
    const statusData: TaskStatusCounts = {
      total: 6,
      succeeded: 1,
      failed: 1,
      running: 1,
      waiting: 1,
      skipped: 1,
      cancelled: 1,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.CANCELLED);
  });

  it("should prioritize FAILED over RUNNING, WAITING, and SUCCEEDED", () => {
    const statusData: TaskStatusCounts = {
      total: 5,
      succeeded: 1,
      failed: 1,
      running: 1,
      waiting: 1,
      skipped: 1,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.FAILED);
  });

  it("should prioritize RUNNING over WAITING and SUCCEEDED", () => {
    const statusData: TaskStatusCounts = {
      total: 4,
      succeeded: 1,
      failed: 0,
      running: 1,
      waiting: 1,
      skipped: 1,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.RUNNING);
  });

  it("should prioritize WAITING over SUCCEEDED", () => {
    const statusData: TaskStatusCounts = {
      total: 3,
      succeeded: 1,
      failed: 0,
      running: 0,
      waiting: 1,
      skipped: 1,
      cancelled: 0,
    };

    expect(getRunStatus(statusData)).toBe(STATUS.WAITING);
  });
});

describe("fetchPipelineRun()", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should fetch pipeline run successfully", async () => {
    const mockPipelineRun: PipelineRunResponse = {
      id: "pipeline-run-123",
      root_execution_id: "exec-456",
      annotations: { test: "value" },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPipelineRun),
    } as Response);

    const result = await fetchPipelineRun(
      "pipeline-run-123",
      "http://backend.test",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://backend.test/api/pipeline_runs/pipeline-run-123",
    );
    expect(result).toEqual(mockPipelineRun);
  });

  it("should handle fetch errors with proper error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    } as Response);

    await expect(
      fetchPipelineRun("invalid-id", "http://backend.test"),
    ).rejects.toThrow("Failed to fetch pipeline run: Not Found");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://backend.test/api/pipeline_runs/invalid-id",
    );
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(
      fetchPipelineRun("pipeline-run-123", "http://backend.test"),
    ).rejects.toThrow("Network error");
  });

  it("should construct correct URL with different backend URLs", async () => {
    const mockPipelineRun: PipelineRunResponse = {
      id: "test-id",
      root_execution_id: "test-exec",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPipelineRun),
    } as Response);

    await fetchPipelineRun("test-id", "https://api.example.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/api/pipeline_runs/test-id",
    );

    await fetchPipelineRun("another-id", "http://localhost:8080");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/pipeline_runs/another-id",
    );
  });

  it("should handle server error responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    } as Response);

    await expect(
      fetchPipelineRun("pipeline-run-123", "http://backend.test"),
    ).rejects.toThrow("Failed to fetch pipeline run: Internal Server Error");
  });
});
