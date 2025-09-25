import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";

import type { IOCellActions, IOCellCopyState } from "./IOCell";
import IOCellHeader from "./IOCellHeader";

vi.mock("@/components/ui/collapsible", () => ({
  CollapsibleTrigger: ({ children }: any) => <button>{children}</button>,
}));

describe("IOCellHeader", () => {
  const mockInputSpec: InputSpec = {
    name: "test-input",
    type: "String",
  };

  const mockArtifactData: ArtifactDataResponse = {
    value: "short-value",
    uri: "gs://bucket/path",
    total_size: 1024,
    is_dir: false,
  };

  const mockCopyState: IOCellCopyState = {
    isCopied: false,
    isTooltipOpen: false,
    copyType: undefined,
  };

  const mockActions: IOCellActions = {
    handleCopyName: vi.fn(),
    handleCopyValue: vi.fn(),
    handleTooltipOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the input name", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("test-input")).toBeInTheDocument();
  });

  it("calls handleCopyName when name is clicked", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const nameElement = screen.getByText("test-input");
    fireEvent.click(nameElement);
    expect(mockActions.handleCopyName).toHaveBeenCalledTimes(1);
  });

  it("shows artifact metadata when artifactData is provided", () => {
    const { container } = render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("short-value")).toBeInTheDocument();
    expect(container.textContent).toContain("String");
  });

  it("does not render artifact metadata when artifactData is null", () => {
    const { container } = render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={null}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText("Link")).not.toBeInTheDocument();
    expect(screen.queryByText("short-value")).not.toBeInTheDocument();
    expect(container.textContent).not.toContain("String");
  });

  it("shows inline value for short strings", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("short-value")).toBeInTheDocument();
  });

  it("does not show inline value for long strings", () => {
    const longValueData = {
      ...mockArtifactData,
      value:
        "this is a very long string that should not be displayed inline because it exceeds the character limit",
    };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={longValueData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText(longValueData.value)).not.toBeInTheDocument();
  });

  it("shows inline value for integers", () => {
    const integerInput = { ...mockInputSpec, type: "Integer" as const };
    const integerData = { ...mockArtifactData, value: "42" };

    render(
      <IOCellHeader
        io={integerInput}
        artifactData={integerData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows inline value for booleans", () => {
    const booleanInput = { ...mockInputSpec, type: "Boolean" as const };
    const booleanData = { ...mockArtifactData, value: "true" };

    render(
      <IOCellHeader
        io={booleanInput}
        artifactData={booleanData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("does not render URI link when uri is null", () => {
    const dataWithoutUri = { ...mockArtifactData, uri: null };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={dataWithoutUri}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText("Link")).not.toBeInTheDocument();
  });
});
