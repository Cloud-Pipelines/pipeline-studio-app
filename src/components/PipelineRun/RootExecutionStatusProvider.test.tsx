import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { usePipelineRunData } from "@/hooks/usePipelineRunData";
import { useBackend } from "@/providers/BackendProvider";

import {
  RootExecutionStatusProvider,
  useRootExecutionContext,
} from "./RootExecutionStatusProvider";

// Mock dependencies
vi.mock("@/providers/BackendProvider");
vi.mock("@/hooks/usePipelineRunData");

// Test component to access context
function TestConsumer() {
  const context = useRootExecutionContext();
  return (
    <div>
      <div data-testid="loading">{context.isLoading.toString()}</div>
      <div data-testid="run-id">{context.runId || "null"}</div>
      <div data-testid="error">{context.error?.message || "null"}</div>
      <div data-testid="details-id">{context.details?.id || "null"}</div>
      <div data-testid="state-available">
        {context.state ? "available" : "null"}
      </div>
    </div>
  );
}

// Invalid consumer (outside provider)
function InvalidConsumer() {
  const context = useRootExecutionContext();
  return <div>{context.runId}</div>;
}

describe("<RootExecutionStatusProvider />", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useBackend).mockReturnValue({
      configured: true,
      available: true,
      ready: true,
      backendUrl: "http://localhost:8000",
      isConfiguredFromEnv: false,
      isConfiguredFromRelativePath: false,
      setEnvConfig: vi.fn(),
      setRelativePathConfig: vi.fn(),
      setBackendUrl: vi.fn(),
      ping: vi.fn(),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProvider = (pipelineRunId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RootExecutionStatusProvider pipelineRunId={pipelineRunId}>
          <TestConsumer />
        </RootExecutionStatusProvider>
      </QueryClientProvider>,
    );
  };

  describe("Provider functionality", () => {
    test("renders children correctly", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
      expect(screen.getByTestId("run-id")).toHaveTextContent("null");
      expect(screen.getByTestId("error")).toHaveTextContent("null");
    });

    test("provides correct context values when data is loaded", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("run-id")).toHaveTextContent("test-run-id-123");
      expect(screen.getByTestId("error")).toHaveTextContent("null");
      expect(screen.getByTestId("details-id")).toHaveTextContent(
        "test-execution-id",
      );
      expect(screen.getByTestId("state-available")).toHaveTextContent(
        "available",
      );
    });

    test("handles loading state correctly", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: undefined,
          state: undefined,
        },
        isLoading: true,
        error: null,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("true");
    });

    test("handles error state correctly", () => {
      const mockError = new Error("Failed to fetch execution info");
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: undefined,
          state: undefined,
        },
        isLoading: false,
        error: mockError,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Failed to fetch execution info",
      );
    });
  });

  describe("Context values", () => {
    test("provides undefined values when no data is loaded", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: undefined,
          state: undefined,
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("details-id")).toHaveTextContent("null");
      expect(screen.getByTestId("state-available")).toHaveTextContent("null");
      expect(screen.getByTestId("run-id")).toHaveTextContent("null");
    });

    test("extracts pipeline_run_id correctly from details", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider("test-execution-id");

      expect(screen.getByTestId("run-id")).toHaveTextContent(
        mockExecutionDetails.pipeline_run_id!,
      );
    });
  });

  describe("useRootExecutionContext hook", () => {
    test("throws error when used outside provider", () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<InvalidConsumer />);
      }).toThrow(
        "useRootExecutionContext must be used within RootExecutionContext",
      );

      consoleSpy.mockRestore();
    });

    test("returns context when used within provider", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider("test-execution-id");

      // If we reach here without throwing, the hook works correctly
      expect(screen.getByTestId("run-id")).toBeInTheDocument();
    });
  });
});
