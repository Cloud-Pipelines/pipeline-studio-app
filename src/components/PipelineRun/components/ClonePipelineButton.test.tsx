import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/dom";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { usePipelineRun } from "@/providers/PipelineRunProvider";

import { ClonePipelineButton } from "./ClonePipelineButton";

vi.mock("@/providers/PipelineRunProvider");

describe("<ClonePipelineButton/>", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockClone = vi.fn();
  const componentSpec = { name: "Test Pipeline" } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePipelineRun).mockReturnValue({
      details: undefined,
      state: undefined,
      metadata: null,
      status: "RUNNING",
      isLoading: false,
      isSubmitting: false,
      isCancelling: false,
      isCloning: false,
      error: null,
      rerun: vi.fn(),
      cancel: vi.fn(),
      clone: mockClone,
    });
  });

  const renderWithClient = (component: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );

  describe("Rendering", () => {
    test("renders clone button", () => {
      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const button = screen.getByTestId("clone-pipeline-run-button");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    test("shows disabled state when cloning", () => {
      vi.mocked(usePipelineRun).mockReturnValue({
        details: undefined,
        state: undefined,
        metadata: null,
        status: "RUNNING",
        isLoading: false,
        isSubmitting: false,
        isCancelling: false,
        isCloning: true,
        error: null,
        rerun: vi.fn(),
        cancel: vi.fn(),
        clone: mockClone,
      });

      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const button = screen.getByTestId("clone-pipeline-run-button");
      expect(button).toBeDisabled();
    });
  });

  describe("Clone functionality", () => {
    test("calls clone function from provider on click", async () => {
      mockClone.mockResolvedValue({
        url: "/editor/cloned-pipeline",
        name: "Cloned Pipeline",
      });

      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const cloneButton = screen.getByTestId("clone-pipeline-run-button");

      await act(async () => {
        fireEvent.click(cloneButton);
      });

      expect(mockClone).toHaveBeenCalledWith(componentSpec);
      expect(mockClone).toHaveBeenCalledTimes(1);
    });

    test("handles clone function with promise", async () => {
      const clonePromise = Promise.resolve({
        url: "/editor/cloned-pipeline",
        name: "Cloned Pipeline",
      });
      mockClone.mockReturnValue(clonePromise);

      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const cloneButton = screen.getByTestId("clone-pipeline-run-button");

      await act(async () => {
        fireEvent.click(cloneButton);
      });

      await waitFor(() => {
        expect(mockClone).toHaveBeenCalledWith(componentSpec);
      });
    });

    test("handles clone errors gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockClone.mockRejectedValue(new Error("Clone failed"));

      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const cloneButton = screen.getByTestId("clone-pipeline-run-button");

      await act(async () => {
        fireEvent.click(cloneButton);
      });

      expect(mockClone).toHaveBeenCalledWith(componentSpec);

      consoleSpy.mockRestore();
    });

    test("button remains enabled after successful clone", async () => {
      mockClone.mockResolvedValue({
        url: "/editor/cloned-pipeline",
        name: "Cloned Pipeline",
      });

      renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);

      const cloneButton = screen.getByTestId("clone-pipeline-run-button");

      await act(async () => {
        fireEvent.click(cloneButton);
      });

      // After clone completes, button should be enabled again
      expect(cloneButton).not.toBeDisabled();
    });
  });
});
