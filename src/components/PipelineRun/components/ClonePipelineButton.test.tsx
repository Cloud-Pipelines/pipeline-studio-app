import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/dom";
import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import useToastNotification from "@/hooks/useToastNotification";
import * as pipelineRunService from "@/services/pipelineRunService";

import { ClonePipelineButton } from "./ClonePipelineButton";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/hooks/useToastNotification");
vi.mock("@/services/pipelineRunService");

describe("<ClonePipelineButton/>", () => {
  const queryClient = new QueryClient();
  const mockNotify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToastNotification).mockReturnValue(mockNotify);
    vi.mocked(pipelineRunService.copyRunToPipeline).mockResolvedValue({
      url: "/editor/cloned-pipeline",
      name: "Cloned Pipeline",
    });
  });

  const componentSpec = { name: "Test Pipeline" } as any;

  const renderWithClient = (component: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );

  test("renders clone button", () => {
    renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);
    expect(
      screen.queryByTestId("clone-pipeline-run-button"),
    ).toBeInTheDocument();
  });

  test("calls copyRunToPipeline and navigate on click", async () => {
    renderWithClient(<ClonePipelineButton componentSpec={componentSpec} />);
    const cloneButton = screen.getByTestId("clone-pipeline-run-button");
    act(() => fireEvent.click(cloneButton));

    await waitFor(() => {
      expect(pipelineRunService.copyRunToPipeline).toHaveBeenCalled();
    });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.stringContaining("cloned"),
      "success",
    );
  });
});
