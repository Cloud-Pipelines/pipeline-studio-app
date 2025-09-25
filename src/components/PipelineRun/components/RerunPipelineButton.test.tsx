import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { BackendProvider } from "@/providers/BackendProvider";
import { PipelineRunsProvider } from "@/providers/PipelineRunsProvider";

import { RerunPipelineButton } from "./RerunPipelineButton";

const testOrigin = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

Object.defineProperty(window, "location", {
  value: {
    origin: testOrigin,
  },
  writable: true,
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSubmit = vi.fn();

vi.mock("@/providers/PipelineRunsProvider", async (importOriginal) => ({
  ...(await importOriginal()),
  usePipelineRuns: vi.fn(() => ({
    submit: mockSubmit,
    isSubmitting: false,
    runs: [],
    latestRun: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

const notifyMock = vi.fn();
vi.mock("@/hooks/useToastNotification", () => ({
  default: () => notifyMock,
}));

describe("<RerunPipelineButton/>", () => {
  const componentSpec = { name: "Test Pipeline" } as any;

  const renderWithProvider = (ui: React.ReactElement) =>
    render(
      <BackendProvider>
        <PipelineRunsProvider pipelineName="Test Pipeline">
          {ui}
        </PipelineRunsProvider>
      </BackendProvider>,
    );

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    navigateMock.mockClear();
    notifyMock.mockClear();
    mockSubmit.mockClear();
  });

  afterEach(async () => {
    vi.clearAllMocks();

    cleanup();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  test("renders rerun button", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    expect(screen.getByTestId("rerun-pipeline-button")).toBeInTheDocument();
  });

  test("calls submit on click", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    expect(mockSubmit).toHaveBeenCalledWith(
      componentSpec,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(rerunButton).not.toBeDisabled();
  });

  test("handles successful rerun", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    const submitCall = mockSubmit.mock.calls[0];
    const { onSuccess } = submitCall[1];

    const mockPipelineRun = { root_execution_id: 123 };

    await act(async () => {
      onSuccess(mockPipelineRun);
    });

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/runs/123",
    });
  });

  test("handles rerun error", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    const submitCall = mockSubmit.mock.calls[0];
    const { onError } = submitCall[1];

    const testError = new Error("Test error");

    await act(async () => {
      onError(testError);
    });

    expect(notifyMock).toHaveBeenCalledWith(
      "Failed to submit pipeline. Test error",
      "error",
    );
  });
});
