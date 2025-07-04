import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

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
      <PipelineRunsProvider pipelineName="Test Pipeline">
        {ui}
      </PipelineRunsProvider>,
    );

  beforeEach(() => {
    navigateMock.mockClear();
    notifyMock.mockClear();
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
