import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";
import { copyToClipboard } from "@/utils/string";

import IOCell from "./IOCell";

// Mock dependencies
vi.mock("@/utils/string", () => ({
  copyToClipboard: vi.fn(),
}));

vi.mock("./IOCellHeader", () => ({
  default: ({ copyState, actions, isOpen }: any) => (
    <div data-testid="io-cell-header">
      <button onClick={actions.handleCopyName}>Copy Name</button>
      <button onClick={actions.handleCopyValue}>Copy Value</button>
      <span data-testid="copy-state">
        {copyState.isCopied ? `${copyState.copyType} copied` : "Not copied"}
      </span>
      <span data-testid="is-open">{isOpen ? "Open" : "Closed"}</span>
    </div>
  ),
}));

vi.mock("./IOCellDetails", () => ({
  default: ({ actions }: any) => (
    <div data-testid="io-cell-details">
      <button onClick={actions.handleCopyValue}>Copy Value from Details</button>
    </div>
  ),
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children, open, onOpenChange }: any) => (
    <div data-testid="collapsible" data-open={open}>
      <button onClick={() => onOpenChange(!open)}>Toggle</button>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children }: any) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
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
    expect(screen.getByText("Copy Name")).toBeInTheDocument();
  });

  it("renders IOCellDetails when artifactData is provided", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("io-cell-details")).toBeInTheDocument();
  });

  it("does not render IOCellDetails when artifactData is null", () => {
    render(<IOCell io={mockInputSpec} artifactData={null} />);

    expect(screen.queryByTestId("io-cell-details")).not.toBeInTheDocument();
  });

  it("handles copy name functionality", async () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByText("Copy Name"));

    expect(copyToClipboard).toHaveBeenCalledWith("test-input");
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");
  });

  it("handles copy value functionality", async () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByText("Copy Value"));

    expect(copyToClipboard).toHaveBeenCalledWith("test-value");
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Value copied");
  });

  it("does not copy value when artifactData.value is null", () => {
    const artifactDataWithoutValue = { ...mockArtifactData, value: null };
    render(
      <IOCell io={mockInputSpec} artifactData={artifactDataWithoutValue} />,
    );

    fireEvent.click(screen.getByText("Copy Value"));

    expect(copyToClipboard).not.toHaveBeenCalled();
  });

  it("clears copied state after timeout", async () => {
    vi.useFakeTimers();

    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    fireEvent.click(screen.getByText("Copy Name"));
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("copy-state")).toHaveTextContent("Not copied");

    vi.useRealTimers();
  });

  it("manages collapsible state correctly", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    expect(screen.getByTestId("is-open")).toHaveTextContent("Closed");

    fireEvent.click(screen.getByText("Toggle"));

    expect(screen.getByTestId("is-open")).toHaveTextContent("Open");
  });

  it("clears timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = render(
      <IOCell io={mockInputSpec} artifactData={mockArtifactData} />,
    );

    fireEvent.click(screen.getByText("Copy Name"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("handles tooltip state management", () => {
    render(<IOCell io={mockInputSpec} artifactData={mockArtifactData} />);

    // Initially not copied
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Not copied");

    // After copying, should show copied state
    fireEvent.click(screen.getByText("Copy Name"));
    expect(screen.getByTestId("copy-state")).toHaveTextContent("Name copied");
  });
});
