import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/dom";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import useToastNotification from "@/hooks/useToastNotification";
import { useBackend } from "@/providers/BackendProvider";
import { usePipelineRun } from "@/providers/PipelineRunProvider";

import { CancelPipelineRunButton } from "./CancelPipelineRunButton";

// Mock the services and hooks
vi.mock("@/hooks/useToastNotification");
vi.mock("@/providers/BackendProvider");
vi.mock("@/providers/PipelineRunProvider");

describe("<CancelPipelineRunButton/>", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const mockNotify: ReturnType<typeof vi.fn> = vi.fn();
  const mockCancel: ReturnType<typeof vi.fn> = vi.fn();

  const basePipelineRunMock = {
    details: undefined,
    state: undefined,
    metadata: null,
    status: {
      run: "UNKNOWN",
      map: new Map(),
      counts: {
        total: 0,
        waiting: 0,
        succeeded: 0,
        failed: 0,
        running: 0,
        skipped: 0,
        cancelled: 0,
      },
    },
    isLoading: false,
    isSubmitting: false,
    isCancelling: false,
    isCloning: false,
    error: null,
    rerun: vi.fn(),
    cancel: mockCancel,
    clone: vi.fn(),
  };

  const mockUsePipelineRun = (overrides = {}) => {
    vi.mocked(usePipelineRun).mockReturnValue({
      ...basePipelineRunMock,
      ...overrides,
    });
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    vi.mocked(useToastNotification).mockReturnValue(mockNotify);

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

    mockUsePipelineRun();
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    return new Promise((resolve) => setTimeout(resolve, 0));
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  describe("Rendering", () => {
    test("renders cancel button with correct icon", () => {
      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("bg-destructive");
    });

    test("renders button when backend is not available", () => {
      vi.mocked(useBackend).mockReturnValue({
        configured: true,
        available: false,
        backendUrl: "http://localhost:8000",
        isConfiguredFromEnv: false,
        isConfiguredFromRelativePath: false,
        setEnvConfig: vi.fn(),
        setRelativePathConfig: vi.fn(),
        setBackendUrl: vi.fn(),
        ping: vi.fn(),
      });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    test("shows cancelling state when isCancelling is true", () => {
      mockUsePipelineRun({ isCancelling: true });

      renderWithQueryClient(<CancelPipelineRunButton />);

      expect(screen.getByText("Cancelling...")).toBeInTheDocument();
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    test("shows cancelled state when status is cancelled", () => {
      mockUsePipelineRun({ status: "CANCELLED" });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("title", "Run cancelled");
    });
  });

  describe("Confirmation Dialog", () => {
    test("opens confirmation dialog when button is clicked", async () => {
      renderWithQueryClient(<CancelPipelineRunButton />);
      const button = screen.getByTestId("cancel-pipeline-run-button");

      await act(() => fireEvent.click(button));

      expect(
        screen.getByRole("heading", { name: "Cancel run" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "The run will be scheduled for cancellation. This action cannot be undone.",
        ),
      ).toBeInTheDocument();
    });

    test("closes confirmation dialog when cancel is clicked", async () => {
      renderWithQueryClient(<CancelPipelineRunButton />);
      const button = screen.getByTestId("cancel-pipeline-run-button");

      await act(() => fireEvent.click(button));
      expect(
        screen.getByRole("heading", { name: "Cancel run" }),
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await act(() => fireEvent.click(cancelButton));

      expect(screen.queryByRole("heading", { name: "Cancel run" })).toBeNull();
    });
  });

  describe("Pipeline Cancellation", () => {
    test("successfully cancels pipeline run", async () => {
      mockCancel.mockResolvedValue(undefined);
      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      await act(() => fireEvent.click(button));
      const confirmButton = screen.getByText("Continue");
      await act(() => fireEvent.click(confirmButton));

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("heading", { name: "Cancel run" })).toBeNull();
    });

    test("handles cancellation error", async () => {
      const errorMessage = "Network error";
      mockCancel.mockRejectedValue(new Error(errorMessage));
      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      await act(() => fireEvent.click(button));
      const confirmButton = screen.getByText("Continue");
      await act(() => fireEvent.click(confirmButton));

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockNotify).toHaveBeenCalledWith(
        `Error cancelling run: Error: ${errorMessage}`,
        "error",
      );
    });

    test("shows loading state during cancellation", async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockCancel.mockReturnValue(pendingPromise);

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      await act(() => fireEvent.click(button));
      const confirmButton = screen.getByText("Continue");

      // Start the cancellation
      fireEvent.click(confirmButton);

      // Verify dialog closes immediately
      expect(screen.queryByRole("heading", { name: "Cancel run" })).toBeNull();

      // Mock the provider to return isCancelling: true
      mockUsePipelineRun({ isCancelling: true });

      // Re-render to show the cancelling state
      renderWithQueryClient(<CancelPipelineRunButton />);

      expect(screen.getByText("Cancelling...")).toBeInTheDocument();
      const cancellingButton = screen.getByRole("button");
      expect(cancellingButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!();

      await waitFor(() => {
        expect(mockCancel).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Status-based rendering", () => {
    test("renders cancel button for RUNNING status", () => {
      mockUsePipelineRun({ status: "RUNNING" });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    test("renders cancel button for WAITING status", () => {
      mockUsePipelineRun({ status: "WAITING" });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.getByTestId("cancel-pipeline-run-button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    test("shows disabled button for SUCCEEDED status", () => {
      mockUsePipelineRun({ status: "SUCCEEDED" });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.queryByTestId("cancel-pipeline-run-button");
      if (button) {
        expect(button).toBeDisabled();
      }
    });

    test("shows disabled button for FAILED status", () => {
      mockUsePipelineRun({ status: "FAILED" });

      renderWithQueryClient(<CancelPipelineRunButton />);

      const button = screen.queryByTestId("cancel-pipeline-run-button");
      if (button) {
        expect(button).toBeDisabled();
      }
    });
  });
});
