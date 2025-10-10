import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

import { useCurrentLevelExecutionData } from "./useCurrentLevelExecutionData";

// Mock dependencies
vi.mock("@/providers/BackendProvider", () => ({
  useBackend: vi.fn(),
}));

vi.mock("@/providers/ComponentSpecProvider", () => ({
  useComponentSpec: vi.fn(),
}));

vi.mock("@/hooks/usePipelineRunData", () => ({
  usePipelineRunData: vi.fn(),
}));

import { usePipelineRunData } from "@/hooks/usePipelineRunData";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

describe("useCurrentLevelExecutionData", () => {
  let queryClient: QueryClient;
  const mockSetTaskStatusMap = vi.fn();

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // Mock execution data
  const mockRootDetails: Partial<GetExecutionInfoResponse> = {
    id: "root-exec-123",
    child_task_execution_ids: {
      "task-1": "456",
      "task-2": "789",
    },
  };

  const mockRootState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      "456": { RUNNING: 1 },
      "789": { SUCCEEDED: 1 },
    },
  };

  const mockNestedDetails: Partial<GetExecutionInfoResponse> = {
    id: "456",
    child_task_execution_ids: {
      "child-1": "111",
      "child-2": "222",
    },
  };

  const mockNestedState: GetGraphExecutionStateResponse = {
    child_execution_status_stats: {
      "111": { RUNNING: 1 },
      "222": { SUCCEEDED: 1 },
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useBackend).mockReturnValue({
      backendUrl: "http://test-backend.com",
      setBackendUrl: vi.fn(),
      configured: true,
      available: true,
      ready: true,
      isConfiguredFromEnv: false,
      isConfiguredFromRelativePath: false,
      setEnvConfig: vi.fn(),
      setRelativePathConfig: vi.fn(),
      ping: vi.fn(),
    });

    vi.mocked(useComponentSpec).mockReturnValue({
      currentSubgraphPath: ["root"],
      setTaskStatusMap: mockSetTaskStatusMap,
      componentSpec: {} as never,
      setComponentSpec: vi.fn(),
      clearComponentSpec: vi.fn(),
      graphSpec: {} as never,
      isLoading: false,
      isValid: true,
      errors: [],
      refetch: vi.fn(),
      updateGraphSpec: vi.fn(),
      saveComponentSpec: vi.fn(),
      undoRedo: {} as never,
      navigateToSubgraph: vi.fn(),
      navigateBack: vi.fn(),
      navigateToPath: vi.fn(),
      canNavigateBack: false,
      taskStatusMap: new Map(),
    });

    // Default mock for usePipelineRunData
    vi.mocked(usePipelineRunData).mockReturnValue({
      executionData: {
        details: mockRootDetails as GetExecutionInfoResponse,
        state: mockRootState,
      },
      rootExecutionId: "root-exec-123",
      isLoading: false,
      error: null,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("root level execution", () => {
    it("should return root execution ID at root level", () => {
      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.currentExecutionId).toBe("root-exec-123");
    });

    it("should build task status map with default status", async () => {
      // Mock with no status stats - should use default status
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockRootDetails as GetExecutionInfoResponse,
          state: {
            child_execution_status_stats: {},
          },
        },
        rootExecutionId: "root-exec-123",
        isLoading: false,
        error: null,
      });

      renderHook(() => useCurrentLevelExecutionData("root-exec-123"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(mockSetTaskStatusMap).toHaveBeenCalled();
      });

      const statusMap = mockSetTaskStatusMap.mock.calls[0][0];
      expect(statusMap.get("task-1")).toBe("WAITING_FOR_UPSTREAM");
      expect(statusMap.get("task-2")).toBe("WAITING_FOR_UPSTREAM");
    });

    it("should build task status map with actual statuses", async () => {
      renderHook(() => useCurrentLevelExecutionData("root-exec-123"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(mockSetTaskStatusMap).toHaveBeenCalled();
      });

      const statusMap = mockSetTaskStatusMap.mock.calls[0][0];
      expect(statusMap.get("task-1")).toBe("RUNNING");
      expect(statusMap.get("task-2")).toBe("SUCCEEDED");
    });
  });

  describe("nested subgraph execution", () => {
    it("should find execution ID one level deep", () => {
      vi.mocked(useComponentSpec).mockReturnValue({
        currentSubgraphPath: ["root", "task-1"],
        setTaskStatusMap: mockSetTaskStatusMap,
        componentSpec: {} as never,
        setComponentSpec: vi.fn(),
        clearComponentSpec: vi.fn(),
        graphSpec: {} as never,
        isLoading: false,
        isValid: true,
        errors: [],
        refetch: vi.fn(),
        updateGraphSpec: vi.fn(),
        saveComponentSpec: vi.fn(),
        undoRedo: {} as never,
        navigateToSubgraph: vi.fn(),
        navigateBack: vi.fn(),
        navigateToPath: vi.fn(),
        canNavigateBack: false,
        taskStatusMap: new Map(),
      });

      // Mock both root and nested calls
      vi.mocked(usePipelineRunData).mockImplementation(
        (executionId: string) => {
          if (executionId === "root-exec-123") {
            return {
              executionData: {
                details: mockRootDetails as GetExecutionInfoResponse,
                state: mockRootState,
              },
              rootExecutionId: "root-exec-123",
              isLoading: false,
              error: null,
            };
          }
          if (executionId === "456") {
            return {
              executionData: {
                details: mockNestedDetails as GetExecutionInfoResponse,
                state: mockNestedState,
              },
              rootExecutionId: "456",
              isLoading: false,
              error: null,
            };
          }
          return {
            executionData: undefined,
            rootExecutionId: undefined,
            isLoading: false,
            error: null,
          };
        },
      );

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.currentExecutionId).toBe("456");
    });

    it("should use fetched data for nested subgraphs", async () => {
      vi.mocked(useComponentSpec).mockReturnValue({
        currentSubgraphPath: ["root", "task-1"],
        setTaskStatusMap: mockSetTaskStatusMap,
        componentSpec: {} as never,
        setComponentSpec: vi.fn(),
        clearComponentSpec: vi.fn(),
        graphSpec: {} as never,
        isLoading: false,
        isValid: true,
        errors: [],
        refetch: vi.fn(),
        updateGraphSpec: vi.fn(),
        saveComponentSpec: vi.fn(),
        undoRedo: {} as never,
        navigateToSubgraph: vi.fn(),
        navigateBack: vi.fn(),
        navigateToPath: vi.fn(),
        canNavigateBack: false,
        taskStatusMap: new Map(),
      });

      // Mock both root and nested calls
      vi.mocked(usePipelineRunData).mockImplementation(
        (executionId: string) => {
          if (executionId === "root-exec-123") {
            return {
              executionData: {
                details: mockRootDetails as GetExecutionInfoResponse,
                state: mockRootState,
              },
              rootExecutionId: "root-exec-123",
              isLoading: false,
              error: null,
            };
          }
          if (executionId === "456") {
            return {
              executionData: {
                details: mockNestedDetails as GetExecutionInfoResponse,
                state: mockNestedState,
              },
              rootExecutionId: "456",
              isLoading: false,
              error: null,
            };
          }
          return {
            executionData: undefined,
            rootExecutionId: undefined,
            isLoading: false,
            error: null,
          };
        },
      );

      renderHook(() => useCurrentLevelExecutionData("root-exec-123"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(mockSetTaskStatusMap).toHaveBeenCalled();
      });

      const statusMap = mockSetTaskStatusMap.mock.calls[0][0];
      expect(statusMap.get("child-1")).toBe("RUNNING");
      expect(statusMap.get("child-2")).toBe("SUCCEEDED");
    });
  });

  describe("loading and error states", () => {
    it("should return loading state", () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: undefined,
        rootExecutionId: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Failed to fetch");

      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: undefined,
        rootExecutionId: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.error).toBe(mockError);
    });
  });

  describe("edge cases", () => {
    it("should handle empty child_task_execution_ids", async () => {
      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: {
            id: "root-exec-123",
            child_task_execution_ids: {},
          } as GetExecutionInfoResponse,
          state: {
            child_execution_status_stats: {},
          },
        },
        rootExecutionId: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useCurrentLevelExecutionData("root-exec-123"), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(mockSetTaskStatusMap).toHaveBeenCalled();
      });

      const statusMap = mockSetTaskStatusMap.mock.calls[0][0];
      expect(statusMap.size).toBe(0);
    });

    it("should handle undefined root details", () => {
      vi.mocked(useComponentSpec).mockReturnValue({
        currentSubgraphPath: ["root", "task-1"],
        setTaskStatusMap: mockSetTaskStatusMap,
        componentSpec: {} as never,
        setComponentSpec: vi.fn(),
        clearComponentSpec: vi.fn(),
        graphSpec: {} as never,
        isLoading: false,
        isValid: true,
        errors: [],
        refetch: vi.fn(),
        updateGraphSpec: vi.fn(),
        saveComponentSpec: vi.fn(),
        undoRedo: {} as never,
        navigateToSubgraph: vi.fn(),
        navigateBack: vi.fn(),
        navigateToPath: vi.fn(),
        canNavigateBack: false,
        taskStatusMap: new Map(),
      });

      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: undefined,
        rootExecutionId: "root-exec-123",
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      // Should return root ID since we can't traverse further
      expect(result.current.currentExecutionId).toBe("root-exec-123");
    });
  });
});
