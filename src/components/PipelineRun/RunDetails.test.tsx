import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { useExecutionStatusQuery } from "@/hooks/useExecutionStatusQuery";
import { useBackend } from "@/providers/BackendProvider";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";
import { PipelineRunsProvider } from "@/providers/PipelineRunsProvider";
import * as executionService from "@/services/executionService";
import * as pipelineRunService from "@/services/pipelineRunService";
import type { ComponentSpec } from "@/utils/componentSpec";

import { RunDetails } from "./RunDetails";

// Mock the hooks and services
vi.mock("@tanstack/react-router", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useNavigate: () => vi.fn(),
  };
});
vi.mock("@/hooks/useExecutionStatusQuery");
vi.mock("@/services/executionService", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFetchExecutionInfo: vi.fn(),
  };
});
vi.mock("@/services/pipelineRunService");
vi.mock("@/providers/BackendProvider");

describe("<RunDetails/>", () => {
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

  const mockCancelledExecutionState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      execution1: { SUCCEEDED: 1 },
      execution2: { CANCELLED: 1 },
    },
  };

  const mockComponentSpec: ComponentSpec = {
    name: "Test Pipeline",
    description: "Test pipeline description",
    metadata: {
      annotations: {
        "test-annotation": "test-value",
      },
    },
    inputs: [],
    outputs: [],
    implementation: {
      container: {
        image: "test-image",
        command: ["test-command"],
        args: ["test-arg"],
      },
    },
  };

  const mockPipelineRun = {
    id: 123,
    root_execution_id: 456,
    created_by: "test-user",
    created_at: "2024-01-01T00:00:00Z",
    pipeline_name: "Test Pipeline",
    status: "RUNNING",
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    vi.mocked(useExecutionStatusQuery).mockReturnValue({
      data: "RUNNING",
      isLoading: false,
      error: null,
    } as any);

    // Mock pipelineRunService
    vi.mocked(pipelineRunService.fetchPipelineRunById).mockResolvedValue(
      mockPipelineRun,
    );

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
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    return new Promise((resolve) => setTimeout(resolve, 0));
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <ComponentSpecProvider spec={mockComponentSpec}>
        <QueryClientProvider client={queryClient}>
          <PipelineRunsProvider pipelineName={mockPipelineRun.pipeline_name}>
            {component}
          </PipelineRunsProvider>
        </QueryClientProvider>
      </ComponentSpecProvider>,
    );
  };

  describe("Inspect Pipeline Button", () => {
    test("should render inspect button", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const inspect = screen.getByTestId("inspect-pipeline-button");
      expect(inspect).toBeInTheDocument();
    });
  });

  describe("Clone Pipeline Button", () => {
    test("should render clone button", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const cloneButton = screen.getByTestId("clone-pipeline-run-button");
      expect(cloneButton).toBeInTheDocument();
    });
  });

  describe("Cancel Pipeline Run Button", () => {
    test("should render cancel button when status is RUNNING", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const cancelButton = screen.getByTestId("cancel-pipeline-run-button");
      expect(cancelButton).toBeInTheDocument();
    });

    test("should NOT render cancel button when status is not RUNNING", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockCancelledExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const cancelButton = screen.queryByTestId("cancel-pipeline-run-button");
      expect(cancelButton).not.toBeInTheDocument();
    });
  });

  describe("Rerun Pipeline Run Button", () => {
    test("should render rerun button when status is CANCELLED", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockCancelledExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const rerunButton = screen.getByTestId("rerun-pipeline-button");
      expect(rerunButton).toBeInTheDocument();
    });

    test("should NOT render rerun button when status is RUNNING", async () => {
      // arrange
      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetails,
          state: mockRunningExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => {},
      });

      // act
      renderWithQueryClient(<RunDetails executionId="test-execution-id" />);

      // assert
      const rerunButton = screen.queryByTestId("rerun-pipeline-button");
      expect(rerunButton).not.toBeInTheDocument();
    });
  });
});
