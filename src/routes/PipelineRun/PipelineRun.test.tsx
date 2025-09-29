import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  ComponentSpecOutput,
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";
import * as executionService from "@/services/executionService";

import PipelineRun from "./PipelineRun";

// Mock the router and other dependencies
vi.mock("@tanstack/react-router", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: "/runs/test-run-id-123",
      search: {},
      hash: "",
      href: "/runs/test-run-id-123",
      state: {},
    }),
  };
});

vi.mock("@/routes/router", () => ({
  runDetailRoute: {
    useParams: () => ({ id: "test-run-id-123" }),
  },
  RUNS_BASE_PATH: "/runs",
}));

vi.mock("@/providers/BackendProvider", () => ({
  useBackend: () => ({
    backendUrl: "http://localhost:8000",
    configured: true,
    available: true,
    ready: true,
    isConfiguredFromEnv: false,
    isConfiguredFromRelativePath: false,
    setEnvConfig: vi.fn(),
    setRelativePathConfig: vi.fn(),
    setBackendUrl: vi.fn(),
    ping: vi.fn(),
  }),
}));

vi.mock("@/services/executionService", () => ({
  useFetchExecutionInfo: vi.fn(),
  useFetchPipelineRun: () => ({
    data: null,
    isLoading: false,
    error: null,
    isFetching: false,
    refetch: () => { },
    enabled: false,
  }),
  countTaskStatuses: vi.fn(),
  getRunStatus: vi.fn(),
  STATUS: {
    SUCCEEDED: "SUCCEEDED",
    FAILED: "FAILED",
    RUNNING: "RUNNING",
    WAITING: "WAITING",
    CANCELLED: "CANCELLED",
    UNKNOWN: "UNKNOWN",
  },
}));

const mockUseComponentSpec = vi.fn();
vi.mock("@/providers/ComponentSpecProvider", async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useComponentSpec: () => mockUseComponentSpec(),
  };
});

vi.mock("@/hooks/useDocumentTitle", () => ({
  useDocumentTitle: () => { },
}));

vi.mock("@/hooks/useFavicon", () => ({
  useFavicon: () => { },
}));

describe("<PipelineRun/>", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockComponentSpec: ComponentSpecOutput = {
    name: "Test Pipeline",
    description: "Test pipeline description",
    inputs: [],
    outputs: [],
    metadata: {
      annotations: undefined,
    },
    implementation: {
      graph: {
        tasks: {
          "task-1": {
            componentRef: {
              spec: {
                name: "Task 1",
                inputs: [],
                outputs: [],
                metadata: {
                  annotations: undefined,
                },
                implementation: {
                  container: {
                    image: "test-image",
                    command: ["test-command"],
                  },
                },
              },
            },
          },
          "task-2": {
            componentRef: {
              spec: {
                name: "Task 2",
                inputs: [],
                outputs: [],
                metadata: {
                  annotations: undefined,
                },
                implementation: {
                  container: {
                    image: "test-image-2",
                    command: ["test-command-2"],
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const mockExecutionDetails: GetExecutionInfoResponse = {
    id: "test-execution-id",
    pipeline_run_id: "test-run-id-123",
    task_spec: {
      componentRef: {
        spec: mockComponentSpec,
      },
    },
    child_task_execution_ids: {
      "task-1": "execution-1",
      "task-2": "execution-2",
    },
  };

  const mockExecutionState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      "execution-1": { SUCCEEDED: 1 },
      "execution-2": { RUNNING: 1 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
      data: {
        details: mockExecutionDetails,
        state: mockExecutionState,
      },
      isLoading: false,
      error: null,
      isFetching: false,
      refetch: () => { },
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  describe("Task Execution IDs", () => {
    test("should add execution IDs to tasks when on runs route", async () => {
      // arrange
      const setComponentSpecSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: null,
        setComponentSpec: setComponentSpecSpy,
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: vi.fn(),
        currentSubgraphPath: ["root"],
        navigateToSubgraph: vi.fn(),
        navigateBack: vi.fn(),
        navigateToPath: vi.fn(),
        canNavigateBack: false,
        taskStatusMap: new Map(),
        graphSpec: {} as never,
        isLoading: false,
        isValid: true,
        errors: [],
        refetch: vi.fn(),
        updateGraphSpec: vi.fn(),
        saveComponentSpec: vi.fn(),
        undoRedo: {} as never,
      });

      // act
      await act(async () =>
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        ),
      );

      // assert - verify that setComponentSpec was called with execution IDs added
      expect(setComponentSpecSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          implementation: expect.objectContaining({
            graph: expect.objectContaining({
              tasks: expect.objectContaining({
                "task-1": expect.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: "execution-1",
                  }),
                }),
                "task-2": expect.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: "execution-2",
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });

    test("should not add execution IDs when child_task_execution_ids is missing", async () => {
      // arrange
      const setComponentSpecSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: null,
        setComponentSpec: setComponentSpecSpy,
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: vi.fn(),
        currentSubgraphPath: ["root"],
        navigateToSubgraph: vi.fn(),
        navigateBack: vi.fn(),
        navigateToPath: vi.fn(),
        canNavigateBack: false,
        taskStatusMap: new Map(),
        graphSpec: {} as never,
        isLoading: false,
        isValid: true,
        errors: [],
        refetch: vi.fn(),
        updateGraphSpec: vi.fn(),
        saveComponentSpec: vi.fn(),
        undoRedo: {} as never,
      });

      const mockExecutionDetailsWithoutIds = {
        ...mockExecutionDetails,
        child_task_execution_ids: {},
      };

      vi.mocked(executionService.useFetchExecutionInfo).mockReturnValue({
        data: {
          details: mockExecutionDetailsWithoutIds,
          state: mockExecutionState,
        },
        isLoading: false,
        error: null,
        isFetching: false,
        refetch: () => { },
      });

      // act
      await act(async () =>
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        ),
      );

      // assert - verify that tasks don't have executionId annotations
      expect(setComponentSpecSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          implementation: expect.objectContaining({
            graph: expect.objectContaining({
              tasks: expect.objectContaining({
                "task-1": expect.not.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: expect.anything(),
                  }),
                }),
                "task-2": expect.not.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: expect.anything(),
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});
