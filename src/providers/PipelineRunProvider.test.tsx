import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { useBackend } from "@/providers/BackendProvider";
import * as executionService from "@/services/executionService";
import * as pipelineRunService from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";

import { PipelineRunProvider, usePipelineRun } from "./PipelineRunProvider";

// Mock dependencies
vi.mock("@/providers/BackendProvider");
vi.mock("@/services/executionService", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFetchExecutionInfo: vi.fn(),
  };
});
vi.mock("@/services/pipelineRunService");

// Test component to access context
function TestConsumer() {
  const context = usePipelineRun();
  return (
    <div>
      <div data-testid="loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error?.message || "null"}</div>
      <div data-testid="details-id">{context.details?.id || "null"}</div>
      <div data-testid="state-available">
        {context.state ? "available" : "null"}
      </div>
      <div data-testid="status">{context.status}</div>
    </div>
  );
}

// Invalid consumer (outside provider)
function InvalidConsumer() {
  const context = usePipelineRun();
  return <div>{context.status}</div>;
}

describe("<PipelineRunProvider />", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockExecutionDetails: GetExecutionInfoResponse = {
    id: "test-execution-id",
    pipeline_run_id: "test-run-id-123",
    task_spec: {
      componentRef: {
        spec: {
          name: "Test Pipeline",
          description: "Test pipeline description",
          metadata: {
            annotations: {
              "test-annotation": "test-value",
            },
          },
          inputs: [],
          outputs: [],
        },
      },
    },
    child_task_execution_ids: {
      task1: "execution1",
      task2: "execution2",
    },
  };

  const mockRunningExecutionState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      execution1: { SUCCEEDED: 1 },
      execution2: { RUNNING: 1 },
    },
  };

  const mockCompletedExecutionState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      execution1: { SUCCEEDED: 1 },
      execution2: { SUCCEEDED: 1 },
    },
  };

  const mockFailedExecutionState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      execution1: { SUCCEEDED: 1 },
      execution2: { FAILED: 1 },
    },
  };

  const mockPipelineRunMetadata: PipelineRun = {
    id: 100,
    root_execution_id: 123,
    pipeline_name: "Test Pipeline Run",
    status: "RUNNING",
    created_at: "2023-01-01T00:00:00Z",
    created_by: "test-user",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useBackend).mockReturnValue({
      configured: true,
      available: true,
      backendUrl: "http://localhost:8000",
      isConfiguredFromEnv: false,
      isConfiguredFromRelativePath: false,
      setEnvConfig: vi.fn(),
      setRelativePathConfig: vi.fn(),
      setBackendUrl: vi.fn(),
      ping: vi.fn(),
    });

    vi.mocked(pipelineRunService.fetchPipelineRunById).mockResolvedValue(
      mockPipelineRunMetadata,
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProvider = (rootExecutionId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PipelineRunProvider rootExecutionId={rootExecutionId}>
          <TestConsumer />
        </PipelineRunProvider>
      </QueryClientProvider>,
    );
  };

  describe("Provider functionality", () => {
    test("renders children correctly", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("null");
      expect(screen.getByTestId("status")).toHaveTextContent("UNKNOWN");
    });

    test("provides correct context values when data is loaded", async () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 1,
        failed: 0,
        running: 1,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("RUNNING");

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("null");
      expect(screen.getByTestId("details-id")).toHaveTextContent(
        "test-execution-id",
      );
      expect(screen.getByTestId("state-available")).toHaveTextContent(
        "available",
      );
      expect(screen.getByTestId("status")).toHaveTextContent("RUNNING");

      // Wait for metadata to be fetched
      await waitFor(() => {
        expect(screen.getByTestId("metadata-id")).toHaveTextContent(
          "test-run-id-123",
        );
        expect(screen.getByTestId("metadata-name")).toHaveTextContent(
          "Test Pipeline Run",
        );
      });
    });

    test("handles loading state correctly", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: true,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
    });

    test("handles error state correctly", () => {
      const mockError = new Error("Failed to fetch execution info");
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: false,
        error: mockError,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to fetch execution info",
      );
    });
  });

  describe("Status calculation", () => {
    test("calculates RUNNING status correctly", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 1,
        failed: 0,
        running: 1,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("RUNNING");

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("status")).toHaveTextContent("RUNNING");
    });

    test("calculates SUCCEEDED status correctly", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockCompletedExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 2,
        failed: 0,
        running: 0,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("SUCCEEDED");

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("status")).toHaveTextContent("SUCCEEDED");
    });

    test("calculates FAILED status correctly", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockFailedExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 1,
        failed: 1,
        running: 0,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("FAILED");

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("status")).toHaveTextContent("FAILED");
    });
  });

  describe("Polling behavior", () => {
    test("starts with polling enabled", () => {
      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );
      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      // Verify polling is initially enabled
      expect(mockUseFetchExecutionInfo).toHaveBeenCalledWith(
        "test-execution-id",
        "http://localhost:8000",
        true,
      );
    });

    test("stops polling when status becomes complete (SUCCEEDED)", async () => {
      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );

      // Mock the service functions used in the effect
      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 2,
        failed: 0,
        running: 0,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("SUCCEEDED");
      vi.spyOn(executionService, "isStatusComplete").mockReturnValue(true);

      // First call - still loading
      mockUseFetchExecutionInfo.mockReturnValueOnce({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      const { rerender } = renderWithProvider("test-execution-id");

      // Simulate data loading with completed status
      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockCompletedExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      // Trigger re-render to simulate data update
      rerender(
        <QueryClientProvider client={queryClient}>
          <PipelineRunProvider rootExecutionId="test-execution-id">
            <TestConsumer />
          </PipelineRunProvider>
        </QueryClientProvider>,
      );

      // Wait for effect to process
      await waitFor(() => {
        // Verify that polling was disabled (false) in subsequent calls
        const calls = mockUseFetchExecutionInfo.mock.calls;
        expect(calls.some((call) => call[2] === false)).toBe(true);
      });
    });

    test("stops polling when status becomes complete (FAILED)", async () => {
      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );

      // Mock the service functions
      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 1,
        failed: 1,
        running: 0,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("FAILED");
      vi.spyOn(executionService, "isStatusComplete").mockReturnValue(true);

      // First call - still loading
      mockUseFetchExecutionInfo.mockReturnValueOnce({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      const { rerender } = renderWithProvider("test-execution-id");

      // Simulate data loading with failed status
      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockFailedExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <PipelineRunProvider rootExecutionId="test-execution-id">
            <TestConsumer />
          </PipelineRunProvider>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        const calls = mockUseFetchExecutionInfo.mock.calls;
        expect(calls.some((call) => call[2] === false)).toBe(true);
      });
    });

    test("continues polling when status is still running", () => {
      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );

      // Mock the service functions for running status
      vi.spyOn(executionService, "countTaskStatuses").mockReturnValue({
        total: 2,
        succeeded: 1,
        failed: 0,
        running: 1,
        waiting: 0,
        skipped: 0,
        cancelled: 0,
      });
      vi.spyOn(executionService, "getRunStatus").mockReturnValue("RUNNING");
      vi.spyOn(executionService, "isStatusComplete").mockReturnValue(false);

      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      // All calls should still have polling enabled (true)
      const calls = mockUseFetchExecutionInfo.mock.calls;
      calls.forEach((call) => {
        expect(call[2]).toBe(true);
      });
    });
  });

  describe("Metadata fetching", () => {
    test("fetches pipeline run metadata when runId is available", async () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      await waitFor(() => {
        expect(pipelineRunService.fetchPipelineRunById).toHaveBeenCalledWith(
          "test-run-id-123",
        );
        expect(screen.getByTestId("metadata-id")).toHaveTextContent(
          "test-run-id-123",
        );
      });
    });

    test("handles metadata fetch failure gracefully", async () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      vi.mocked(pipelineRunService.fetchPipelineRunById).mockRejectedValue(
        new Error("Failed to fetch metadata"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderWithProvider("test-execution-id");

      await waitFor(() => {
        expect(screen.getByTestId("metadata-id")).toHaveTextContent("null");
      });

      consoleSpy.mockRestore();
    });

    test("does not fetch metadata when no runId is available", () => {
      const executionDetailsWithoutRunId = {
        ...mockExecutionDetails,
        pipeline_run_id: undefined,
      };

      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: executionDetailsWithoutRunId,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(pipelineRunService.fetchPipelineRunById).not.toHaveBeenCalled();
      expect(screen.getByTestId("metadata-id")).toHaveTextContent("null");
    });
  });

  describe("Context values", () => {
    test("provides undefined values when no data is loaded", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("details-id")).toHaveTextContent("null");
      expect(screen.getByTestId("state-available")).toHaveTextContent("null");
      expect(screen.getByTestId("metadata-id")).toHaveTextContent("null");
      expect(screen.getByTestId("status")).toHaveTextContent("UNKNOWN");
    });
  });

  describe("usePipelineRun hook", () => {
    test("throws error when used outside provider", () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<InvalidConsumer />);
      }).toThrow("usePipelineRun must be used within PipelineRunProvider");

      consoleSpy.mockRestore();
    });

    test("returns context when used within provider", () => {
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      // If we reach here without throwing, the hook works correctly
      expect(screen.getByTestId("status")).toBeInTheDocument();
    });
  });

  describe("Backend integration", () => {
    test("uses backendUrl from BackendProvider", () => {
      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );
      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(mockUseFetchExecutionInfo).toHaveBeenCalledWith(
        "test-execution-id",
        "http://localhost:8000",
        true,
      );
    });

    test("handles different backend URLs", () => {
      const customBackendUrl = "https://custom-backend.com";
      vi.mocked(useBackend).mockReturnValue({
        configured: true,
        available: true,
        backendUrl: customBackendUrl,
        isConfiguredFromEnv: false,
        isConfiguredFromRelativePath: false,
        setEnvConfig: vi.fn(),
        setRelativePathConfig: vi.fn(),
        setBackendUrl: vi.fn(),
        ping: vi.fn(),
      });

      const mockUseFetchExecutionInfo = vi.mocked(
        executionService.useFetchExecutionInfo,
      );
      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: vi.fn(),
      });

      renderWithProvider("test-execution-id");

      expect(mockUseFetchExecutionInfo).toHaveBeenCalledWith(
        "test-execution-id",
        customBackendUrl,
        true,
      );
    });

    test("refetches execution info when backend URL changes", () => {
      const mockRefetch = vi.fn();
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
        isFetching: false,
        refetch: mockRefetch,
      });

      renderWithProvider("test-execution-id");

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
