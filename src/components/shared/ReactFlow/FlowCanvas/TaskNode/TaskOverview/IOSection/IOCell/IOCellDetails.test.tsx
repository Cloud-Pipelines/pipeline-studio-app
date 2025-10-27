import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";

import type { IOCellActions } from "./IOCell";
import IOCellDetails from "./IOCellDetails";

vi.mock("./IOCodeViewer", () => ({
  default: ({ title, value }: any) => (
    <div data-testid="io-code-viewer" data-title={title} data-value={value}>
      {value}
    </div>
  ),
}));

describe("IOCellDetails", () => {
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

  const mockActions: IOCellActions = {
    handleCopyName: vi.fn(),
    handleCopyValue: vi.fn(),
    handleTooltipOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders IOCodeViewer when value exists", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    const codeViewer = screen.getByTestId("io-code-viewer");
    expect(codeViewer).toBeInTheDocument();
    expect(codeViewer).toHaveAttribute("data-title", "test-input");
    expect(codeViewer).toHaveAttribute("data-value", "test-value");
  });

  it("calls handleCopyValue when code viewer area is clicked", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    const codeViewer = screen.getByTestId("io-code-viewer");
    fireEvent.click(codeViewer.parentElement!);

    expect(mockActions.handleCopyValue).toHaveBeenCalledTimes(1);
  });

  it("does not render IOCodeViewer when value is null", () => {
    const artifactWithoutValue = { ...mockArtifactData, value: null };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactWithoutValue}
        actions={mockActions}
      />,
    );

    expect(screen.queryByTestId("io-code-viewer")).not.toBeInTheDocument();
  });

  it("does not render IOCodeViewer when value is empty string", () => {
    const artifactWithEmptyValue = { ...mockArtifactData, value: "" };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactWithEmptyValue}
        actions={mockActions}
      />,
    );

    expect(screen.queryByTestId("io-code-viewer")).not.toBeInTheDocument();
  });

  it("renders URI section when uri exists", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("URI:")).toBeInTheDocument();
    expect(screen.getByText("gs://bucket/path")).toBeInTheDocument();
  });

  it("does not render URI section when uri is null", () => {
    const artifactWithoutUri = { ...mockArtifactData, uri: null };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactWithoutUri}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText("URI:")).not.toBeInTheDocument();
  });

  it("does not render URI section when uri is empty string", () => {
    const artifactWithEmptyUri = { ...mockArtifactData, uri: "" };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactWithEmptyUri}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText("URI:")).not.toBeInTheDocument();
  });

  it("renders both sections when both value and URI exist", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    expect(screen.getByTestId("io-code-viewer")).toBeInTheDocument();
    expect(screen.getByText("URI:")).toBeInTheDocument();
  });

  it("renders only URI when value is null but URI exists", () => {
    const artifactDataOnlyUri = {
      ...mockArtifactData,
      value: null,
      uri: "gs://bucket/path",
    };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactDataOnlyUri}
        actions={mockActions}
      />,
    );

    expect(screen.queryByTestId("io-code-viewer")).not.toBeInTheDocument();
    expect(screen.getByText("URI:")).toBeInTheDocument();
  });

  it("renders only value when URI is null but value exists", () => {
    const artifactDataOnlyValue = {
      ...mockArtifactData,
      value: "test-value",
      uri: null,
    };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={artifactDataOnlyValue}
        actions={mockActions}
      />,
    );

    expect(screen.getByTestId("io-code-viewer")).toBeInTheDocument();
    expect(screen.queryByText("URI:")).not.toBeInTheDocument();
  });
});
