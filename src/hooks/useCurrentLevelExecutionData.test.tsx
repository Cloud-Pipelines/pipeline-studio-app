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

vi.mock("@/services/executionService", () => ({
  useFetchExecutionInfo: vi.fn(),
}));

import { useBackend } from "@/providers/BackendProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { useFetchExecutionInfo } from "@/services/executionService";

// Helper to create mock execution details
const createMockDetails = (
  childIds: Record<string, string> = {},
): GetExecutionInfoResponse => ({
  id: "test-exec-id",
  task_spec: { componentRef: {} },
  child_task_execution_ids: childIds,
});

// Helper to create mock execution state
const createMockState = (
  statusStats: Record<string, Record<string, number>> = {},
): GetGraphExecutionStateResponse => ({
  child_execution_status_stats: statusStats,
});

describe("useCurrentLevelExecutionData", () => {
  let queryClient: QueryClient;
  const mockSetTaskStatusMap = vi.fn();

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

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

    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("root level execution", () => {
    it("should return root execution ID at root level", () => {
      const rootDetails = createMockDetails();
      const rootState = createMockState();

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: rootDetails, state: rootState },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.currentExecutionId).toBe("root-exec-123");
    });

    it("should build task status map with default status", async () => {
      const rootDetails = createMockDetails({
        "task-1": "123",
        "task-2": "456",
      });

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: rootDetails, state: undefined },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
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
      const rootDetails = createMockDetails({
        "task-1": "123",
        "task-2": "456",
      });

      const rootState = createMockState({
        "123": { RUNNING: 1 },
        "456": { SUCCEEDED: 1 },
      });

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: rootDetails, state: rootState },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
      });

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
      const rootDetails = createMockDetails({ "task-1": "456" });

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

      const nestedDetails = createMockDetails();

      // First call for root, second call for nested
      vi.mocked(useFetchExecutionInfo)
        .mockReturnValueOnce({
          data: { details: rootDetails, state: createMockState() },
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: vi.fn(),
        })
        .mockReturnValueOnce({
          data: { details: nestedDetails, state: createMockState() },
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: vi.fn(),
        });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.currentExecutionId).toBe("456");
    });

    it("should use fetched data for nested subgraphs", async () => {
      const rootDetails = createMockDetails({ "nested-task": "nested-123" });

      vi.mocked(useComponentSpec).mockReturnValue({
        currentSubgraphPath: ["root", "nested-task"],
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

      const nestedDetails = createMockDetails({
        "child-1": "child-exec-1",
        "child-2": "child-exec-2",
      });

      const nestedState = createMockState({
        "child-exec-1": { RUNNING: 1 },
        "child-exec-2": { SUCCEEDED: 1 },
      });

      // First call for root, second call for nested
      vi.mocked(useFetchExecutionInfo)
        .mockReturnValueOnce({
          data: { details: rootDetails, state: createMockState() },
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: vi.fn(),
        })
        .mockReturnValueOnce({
          data: { details: nestedDetails, state: nestedState },
          isLoading: false,
          isFetching: false,
          error: null,
          refetch: vi.fn(),
        });

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
      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: undefined, state: undefined },
        isLoading: true,
        isFetching: true,
        error: null,
        refetch: vi.fn(),
      });

      const { result } = renderHook(
        () => useCurrentLevelExecutionData("root-exec-123"),
        { wrapper: createWrapper },
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should return error state", () => {
      const mockError = new Error("Failed to fetch");

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: undefined, state: undefined },
        isLoading: false,
        isFetching: false,
        error: mockError,
        refetch: vi.fn(),
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
      const rootDetails = createMockDetails();

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: rootDetails, state: undefined },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
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

      vi.mocked(useFetchExecutionInfo).mockReturnValue({
        data: { details: undefined, state: undefined },
        isLoading: false,
        isFetching: false,
        error: null,
        refetch: vi.fn(),
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
