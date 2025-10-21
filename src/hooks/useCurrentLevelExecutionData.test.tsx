import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMatch } from "@tanstack/react-router";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";

import { useCurrentLevelExecutionData } from "./useCurrentLevelExecutionData";

// Mock dependencies
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useMatch: vi.fn(),
  };
});

vi.mock("@/providers/BackendProvider", () => ({
  useBackend: vi.fn(),
}));

vi.mock("@/providers/ComponentSpecProvider", () => ({
  useComponentSpec: vi.fn(),
}));

vi.mock("@/hooks/usePipelineRunData", () => ({
  usePipelineRunData: vi.fn(),
}));

vi.mock("@/services/executionService", () => ({
  fetchExecutionDetails: vi.fn(),
}));

import { usePipelineRunData } from "@/hooks/usePipelineRunData";
import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { fetchExecutionDetails } from "@/services/executionService";

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

    vi.mocked(useMatch).mockReturnValue({
      params: { id: "root-exec-123" },
    } as never);

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

    // Default mock for fetchExecutionDetails
    // This is used by useNestedExecutionId to fetch execution details for each level
    vi.mocked(fetchExecutionDetails).mockImplementation(
      async (executionId: string) => {
        if (executionId === "root-exec-123") {
          return mockRootDetails as GetExecutionInfoResponse;
        }
        if (executionId === "456") {
          return mockNestedDetails as GetExecutionInfoResponse;
        }
        throw new Error(`Unexpected execution ID: ${executionId}`);
      },
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("root level execution", () => {
    it("should return root execution ID at root level", async () => {
      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.currentExecutionId).toBe("root-exec-123");
      });
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

      renderHook(() => useCurrentLevelExecutionData(), {
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
      renderHook(() => useCurrentLevelExecutionData(), {
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
    it("should find execution ID one level deep", async () => {
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

      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(result.current.currentExecutionId).toBe("456");
      });
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

      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      // First wait for the execution ID to be resolved to "456"
      await waitFor(() => {
        expect(result.current.currentExecutionId).toBe("456");
      });

      // Then wait for nested details to be loaded and status map updated
      await waitFor(() => {
        expect(result.current.details).toBeDefined();
        expect(result.current.details?.id).toBe("456");
      });

      // Wait for the status map to be updated with nested task data
      await waitFor(() => {
        const calls = mockSetTaskStatusMap.mock.calls;
        if (calls.length === 0) return false;
        const lastStatusMap = calls[calls.length - 1][0];
        return lastStatusMap.has("child-1") && lastStatusMap.has("child-2");
      });

      const lastStatusMap =
        mockSetTaskStatusMap.mock.calls[
          mockSetTaskStatusMap.mock.calls.length - 1
        ][0];
      expect(lastStatusMap.get("child-1")).toBe("RUNNING");
      expect(lastStatusMap.get("child-2")).toBe("SUCCEEDED");
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

      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

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

      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe("cache optimization", () => {
    it("should use cached execution details instead of fetching", async () => {
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

      // Pre-populate the cache with execution details
      queryClient.setQueryData(
        ["execution-details", "root-exec-123"],
        mockRootDetails,
      );

      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockRootDetails as GetExecutionInfoResponse,
          state: mockRootState,
        },
        rootExecutionId: "root-exec-123",
        isLoading: false,
        error: null,
      });

      // Clear the mock call count to track if fetchExecutionDetails is called
      vi.mocked(fetchExecutionDetails).mockClear();

      renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(
          queryClient.getQueryData(["execution-details", "root-exec-123"]),
        ).toBeDefined();
      });

      // fetchExecutionDetails should NOT be called because data is in cache
      expect(fetchExecutionDetails).not.toHaveBeenCalledWith(
        "root-exec-123",
        "http://test-backend.com",
      );
    });

    it("should populate cache when fetching execution details", async () => {
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

      renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      // Wait for the nested execution ID to be resolved
      await waitFor(() => {
        const cachedDetails =
          queryClient.getQueryData<GetExecutionInfoResponse>([
            "execution-details",
            "root-exec-123",
          ]);
        return cachedDetails !== undefined;
      });

      // Verify the cache was populated with execution details
      const cachedRootDetails = queryClient.getQueryData([
        "execution-details",
        "root-exec-123",
      ]);
      expect(cachedRootDetails).toEqual(mockRootDetails);
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

      renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      await waitFor(() => {
        expect(mockSetTaskStatusMap).toHaveBeenCalled();
      });

      const statusMap = mockSetTaskStatusMap.mock.calls[0][0];
      expect(statusMap.size).toBe(0);
    });

    it("should handle missing child execution ID", async () => {
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

      // Mock root details without the "task-1" child execution ID
      const mockRootDetailsWithoutChild: Partial<GetExecutionInfoResponse> = {
        id: "root-exec-123",
        child_task_execution_ids: {
          "task-2": "789",
        },
      };

      vi.mocked(usePipelineRunData).mockReturnValue({
        executionData: {
          details: mockRootDetailsWithoutChild as GetExecutionInfoResponse,
          state: mockRootState,
        },
        rootExecutionId: "root-exec-123",
        isLoading: false,
        error: null,
      });

      // Update fetchExecutionDetails mock to return details without "task-1"
      vi.mocked(fetchExecutionDetails).mockImplementation(
        async (executionId: string) => {
          if (executionId === "root-exec-123") {
            return mockRootDetailsWithoutChild as GetExecutionInfoResponse;
          }
          throw new Error(`Unexpected execution ID: ${executionId}`);
        },
      );

      const { result } = renderHook(() => useCurrentLevelExecutionData(), {
        wrapper: createWrapper,
      });

      // Should return root ID since we can't find the child execution ID for "task-1"
      await waitFor(() => {
        expect(result.current.currentExecutionId).toBe("root-exec-123");
      });
    });
  });
});
