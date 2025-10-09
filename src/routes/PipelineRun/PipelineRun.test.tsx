import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type {
  ComponentSpecOutput,
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";

import PipelineRun from "./PipelineRun";

vi.mock("@/routes/router", () => ({
  runDetailRoute: {
    useParams: () => ({ id: "test-run-id-123" }),
  },
}));

const mockUseBackend = vi.fn();
vi.mock("@/providers/BackendProvider", () => ({
  useBackend: () => mockUseBackend(),
}));

const mockUseFetchExecutionInfo = vi.fn();
vi.mock("@/services/executionService", () => ({
  countTaskStatuses: vi.fn(),
  getRunStatus: vi.fn(),
  useFetchExecutionInfo: () => mockUseFetchExecutionInfo(),
  STATUS: {
    SUCCEEDED: "SUCCEEDED",
    FAILED: "FAILED",
    RUNNING: "RUNNING",
  },
}));

const mockUsePipelineRunData = vi.fn();
vi.mock("@/hooks/usePipelineRunData", () => ({
  usePipelineRunData: () => mockUsePipelineRunData(),
}));

const mockUseComponentSpec = vi.fn();
vi.mock("@/providers/ComponentSpecProvider", async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useComponentSpec: () => mockUseComponentSpec(),
  };
});

vi.mock("@/hooks/useDocumentTitle", () => ({ useDocumentTitle: vi.fn() }));
vi.mock("@/favicon", () => ({
  faviconManager: { reset: vi.fn(), updateFavicon: vi.fn() },
}));
vi.mock("@/utils/backend", () => ({ getBackendStatusString: vi.fn() }));
vi.mock("@/components/PipelineRun", () => ({
  default: () => <div data-testid="pipeline-run-page" />,
}));

describe("PipelineRun", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockComponentSpec: ComponentSpecOutput = {
    name: "Test Pipeline",
    implementation: {
      graph: {
        tasks: {
          "task-1": { componentRef: { spec: { name: "Task 1" } } },
          "task-2": { componentRef: { spec: { name: "Task 2" } } },
        },
      },
    },
  };

  const mockExecutionDetails: GetExecutionInfoResponse = {
    id: "test-execution-id",
    task_spec: { componentRef: { spec: mockComponentSpec } },
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

    mockUseBackend.mockReturnValue({
      configured: true,
      available: true,
      ready: true,
    });

    mockUsePipelineRunData.mockReturnValue({
      rootExecutionId: "test-execution-id",
      isLoading: false,
      error: null,
    });

    mockUseFetchExecutionInfo.mockReturnValue({
      data: { details: mockExecutionDetails, state: mockExecutionState },
      isLoading: false,
      error: null,
    });

    mockUseComponentSpec.mockReturnValue({
      componentSpec: null,
      setComponentSpec: vi.fn(),
      clearComponentSpec: vi.fn(),
      setTaskStatusMap: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  describe("Task Execution IDs", () => {
    test("should add execution IDs to tasks when execution data is available", async () => {
      const setComponentSpecSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: null,
        setComponentSpec: setComponentSpecSpy,
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: vi.fn(),
      });

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        );
      });

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
      const setComponentSpecSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: null,
        setComponentSpec: setComponentSpecSpy,
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: vi.fn(),
      });

      const mockExecutionDetailsWithoutIds = {
        ...mockExecutionDetails,
        child_task_execution_ids: {},
      };

      mockUseFetchExecutionInfo.mockReturnValue({
        data: {
          details: mockExecutionDetailsWithoutIds,
          state: mockExecutionState,
        },
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        );
      });

      expect(setComponentSpecSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          implementation: expect.objectContaining({
            graph: expect.objectContaining({
              tasks: expect.objectContaining({
                "task-1": expect.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: undefined,
                  }),
                }),
                "task-2": expect.objectContaining({
                  annotations: expect.objectContaining({
                    executionId: undefined,
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe("Task Status Map", () => {
    test("should build task status map with correct statuses", async () => {
      const setTaskStatusMapSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: mockComponentSpec,
        setComponentSpec: vi.fn(),
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: setTaskStatusMapSpy,
      });

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        );
      });

      expect(setTaskStatusMapSpy).toHaveBeenCalledWith(expect.any(Map));
      const [[taskStatusMap]] = setTaskStatusMapSpy.mock.calls;
      expect(taskStatusMap.get("task-1")).toBe("SUCCEEDED");
      expect(taskStatusMap.get("task-2")).toBe("RUNNING");
    });

    test("should set tasks to WAITING_FOR_UPSTREAM when no state data available", async () => {
      const setTaskStatusMapSpy = vi.fn();
      mockUseComponentSpec.mockReturnValue({
        componentSpec: mockComponentSpec,
        setComponentSpec: vi.fn(),
        clearComponentSpec: vi.fn(),
        setTaskStatusMap: setTaskStatusMapSpy,
      });

      mockUseFetchExecutionInfo.mockReturnValue({
        data: { details: mockExecutionDetails, state: null },
        isLoading: false,
        error: null,
      });

      await act(async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <ComponentSpecProvider spec={undefined}>
              <PipelineRun />
            </ComponentSpecProvider>
          </QueryClientProvider>,
        );
      });

      const [[taskStatusMap]] = setTaskStatusMapSpy.mock.calls;
      expect(taskStatusMap.get("task-1")).toBe("WAITING_FOR_UPSTREAM");
      expect(taskStatusMap.get("task-2")).toBe("WAITING_FOR_UPSTREAM");
    });
  });

  test("should render successfully with valid data", async () => {
    mockUseComponentSpec.mockReturnValue({
      componentSpec: mockComponentSpec,
      setComponentSpec: vi.fn(),
      clearComponentSpec: vi.fn(),
      setTaskStatusMap: vi.fn(),
    });

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <ComponentSpecProvider spec={undefined}>
          <PipelineRun />
        </ComponentSpecProvider>
      </QueryClientProvider>,
    );

    expect(getByTestId("pipeline-run-page")).toBeInTheDocument();
  });
});
