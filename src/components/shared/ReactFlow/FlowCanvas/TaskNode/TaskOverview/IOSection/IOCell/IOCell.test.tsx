import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";

import IOCell from "./IOCell";

vi.mock("@/utils/string", () => ({
  copyToClipboard: vi.fn(),
}));

const { copyToClipboard } = vi.mocked(await import("@/utils/string"));

vi.mock("./IOCellHeader", () => ({
  default: ({ copyState, actions, isOpen }: any) => (
    <div data-testid="io-cell-header">
      <button onClick={actions.handleCopyName} data-testid="copy-name-btn">
        Copy Name
      </button>
      <button onClick={actions.handleCopyValue} data-testid="copy-value-btn">
        Copy Value
      </button>
      <span data-testid="copy-state">
        {copyState.isCopied ? `${copyState.copyType} copied` : "Not copied"}
      </span>
      <span data-testid="is-open">{isOpen ? "Open" : "Closed"}</span>
    </div>
  ),
}));

vi.mock("./IOCellDetails", () => ({
  default: () => <div data-testid="io-cell-details">Details</div>,
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: any) => <div>{children}</div>,
  CollapsibleContent: ({ children }: any) => <div>{children}</div>,
}));

describe("IOCell", () => {
  const mockInputSpec: InputSpec = {
    name: "test-input",
    type: "String",
  };

  const mockArtifactData: ArtifactDataResponse = {
    value: "test-value",
    uri: "gs://bucket/path",
    total_size: 1024,
    is_dir: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders IOCell with header", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("io-cell-header")).toBeInTheDocument();
    expect(screen.getByTestId("copy-name-btn")).toBeInTheDocument();
  });

  it("renders IOCellDetails when artifactData is provided", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("io-cell-details")).toBeInTheDocument();
  });

  it("does not render IOCellDetails when artifactData is null", () => {
    render(<IOCell io={mockInputSpec} artifactData={null} />);

    expect(screen.queryByTestId("io-cell-details")).not.toBeInTheDocument();
  });

  it("handles copy name functionality", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByTestId("copy-name-btn"));

    expect(copyToClipboard).toHaveBeenCalledWith("test-input");
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");
  });

  it("handles copy value functionality", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByTestId("copy-value-btn"));

    expect(copyToClipboard).toHaveBeenCalledWith("test-value");
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Value copied");
  });

  it("does not copy value when artifactData.value is null", () => {
    const artifactDataWithoutValue = { ...mockArtifactData, value: null };
    render(
      <IOCell io={mockInputSpec} artifactData={artifactDataWithoutValue} />,
    );

    fireEvent.click(screen.getByTestId("copy-value-btn"));

    expect(copyToClipboard).not.toHaveBeenCalled();
  });

  it("clears copied state after timeout", async () => {
    vi.useFakeTimers();

    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByTestId("copy-name-btn"));
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("copy-state")).toHaveTextContent("Not copied");

    vi.useRealTimers();
  });

  it("starts with collapsible closed", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("is-open")).toHaveTextContent("Closed");
  });

  it("clears timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = render(
      <IOCell io={mockInputSpec} artifactData={mockArtifactData} />,
    );

    fireEvent.click(screen.getByTestId("copy-name-btn"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("manages copy state transitions correctly", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("copy-state")).toHaveTextContent("Not copied");

    fireEvent.click(screen.getByTestId("copy-name-btn"));
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");

    fireEvent.click(screen.getByTestId("copy-value-btn"));
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Value copied");
  });

  it("handles empty artifact data gracefully", () => {
    const emptyArtifactData = {
      ...mockArtifactData,
      value: "",
      uri: null,
    };

    render(<IOCell io={mockInputSpec} artifactData={emptyArtifactData} />);

    expect(screen.getByTestId("io-cell-header")).toBeInTheDocument();

    expect(screen.getByTestId("io-cell-details")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("copy-value-btn"));
    expect(copyToClipboard).not.toHaveBeenCalled();
  });
});
