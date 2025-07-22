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

vi.mock("@/providers/PipelineRunsProvider", async (importOriginal) => ({
  ...(await importOriginal()),
  usePipelineRuns: vi.fn(() => ({
    submit: vi.fn(),
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
        ,
      </BackendProvider>,
    );

  beforeEach(() => {
    navigateMock.mockClear();
    notifyMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    return new Promise((resolve) => setTimeout(resolve, 0));
  });

  test("renders rerun button", () => {
    renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    expect(screen.getByTestId("rerun-pipeline-button")).toBeInTheDocument();
  });

  test("calls submit on click", () => {
    renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    const rerunButton = screen.getByTestId("rerun-pipeline-button");
    act(() => fireEvent.click(rerunButton));
    expect(rerunButton).not.toBeDisabled();
  });
});
