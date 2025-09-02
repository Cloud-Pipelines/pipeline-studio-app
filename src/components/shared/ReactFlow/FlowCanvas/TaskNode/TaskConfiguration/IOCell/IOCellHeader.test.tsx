import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";

import type { IOCellActions, IOCellCopyState } from "./IOCell";
import IOCellHeader from "./IOCellHeader";

// Mock dependencies
vi.mock("@/components/ui/layout", () => ({
  BlockStack: ({ children, gap, className }: any) => (
    <div data-testid="block-stack" data-gap={gap} className={className}>
      {children}
    </div>
  ),
  InlineStack: ({ children, align, blockAlign, gap, className }: any) => (
    <div
      data-testid="inline-stack"
      data-align={align}
      data-block-align={blockAlign}
      data-gap={gap}
      className={className}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, open, onOpenChange, delayDuration }: any) => (
    <div data-testid="tooltip" data-open={open} data-delay={delayDuration}>
      <button onClick={() => onOpenChange(!open)}>Toggle Tooltip</button>
      {children}
    </div>
  ),
  TooltipTrigger: ({ children, className }: any) => (
    <div data-testid="tooltip-trigger" className={className}>
      {children}
    </div>
  ),
  TooltipContent: ({ children, className, arrowClassName }: any) => (
    <div
      data-testid="tooltip-content"
      className={className}
      data-arrow-class={arrowClassName}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/collapsible", () => ({
  CollapsibleTrigger: ({ children, disabled, className }: any) => (
    <button
      data-testid="collapsible-trigger"
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/link", () => ({
  Link: ({ children, href, external, iconClassName, className }: any) => (
    <a
      data-testid="link"
      href={href}
      data-external={external}
      data-icon-class={iconClassName}
      className={className}
    >
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  ChevronsUpDown: ({ className }: any) => (
    <div data-testid="chevrons-up-down" className={className}>
      ChevronIcon
    </div>
  ),
}));

vi.mock("@/utils/string", () => ({
  formatBytes: (bytes: number) => `${bytes}B`,
}));

vi.mock("@/utils/URL", () => ({
  convertGcsUrlToBrowserUrl: (url: string, _isDir: boolean) => `browser-${url}`,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
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

    fireEvent.click(screen.getByText("test-input"));
    expect(mockActions.handleCopyName).toHaveBeenCalledTimes(1);
  });

  it("shows default copy text in tooltip when not copied", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("shows copied state in tooltip when copied", () => {
    const copiedState = {
      ...mockCopyState,
      isCopied: true,
      copyType: "Name" as const,
    };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={copiedState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("Name copied")).toBeInTheDocument();
  });

  it("renders artifact metadata when artifactData is provided", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("1024B •")).toBeInTheDocument();
  });

  it("does not render artifact metadata when artifactData is null", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={null}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.queryByText("Link")).not.toBeInTheDocument();
    expect(screen.queryByText("1024B •")).not.toBeInTheDocument();
  });

  it("renders external link with correct URL", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "browser-gs://bucket/path");
    expect(link).toHaveAttribute("data-external", "true");
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

  it("shows collapsible trigger when content is collapsible", () => {
    const longValueData = {
      ...mockArtifactData,
      value: "this is a very long string that should be collapsible",
    };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={longValueData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const trigger = screen.getByTestId("collapsible-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).not.toBeDisabled();
  });

  it("disables collapsible trigger when content is not collapsible", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const trigger = screen.getByTestId("collapsible-trigger");
    expect(trigger).toBeDisabled();
  });

  it("renders chevron icon in collapsible trigger", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByTestId("chevrons-up-down")).toBeInTheDocument();
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

  it("does not render inline value when value is null", () => {
    const dataWithoutValue = { ...mockArtifactData, value: null };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={dataWithoutValue}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    // Should not show any inline value
    expect(screen.queryByText("short-value")).not.toBeInTheDocument();
  });

  it("handles tooltip open/close interaction", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    fireEvent.click(screen.getByText("Toggle Tooltip"));
    expect(mockActions.handleTooltipOpen).toHaveBeenCalledWith(true);
  });

  it("formats file size correctly", () => {
    const largeFileData = { ...mockArtifactData, total_size: 2048 };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={largeFileData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    expect(screen.getByText("2048B •")).toBeInTheDocument();
  });

  it("handles directory URIs correctly", () => {
    const dirData = { ...mockArtifactData, is_dir: true };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={dirData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "browser-gs://bucket/path");
  });

  it("shows tooltip with correct delay duration", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
      />,
    );

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toHaveAttribute("data-delay", "300");
  });

  it("renders when isOpen is true", () => {
    const longValueData = {
      ...mockArtifactData,
      value: "this is a very long string that should be collapsible",
    };

    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={longValueData}
        copyState={mockCopyState}
        actions={mockActions}
        isOpen={true}
      />,
    );

    // Component should still render normally
    expect(screen.getByText("test-input")).toBeInTheDocument();
  });

  it("renders when isOpen is false", () => {
    render(
      <IOCellHeader
        io={mockInputSpec}
        artifactData={mockArtifactData}
        copyState={mockCopyState}
        actions={mockActions}
        isOpen={false}
      />,
    );

    // Component should still render normally
    expect(screen.getByText("test-input")).toBeInTheDocument();
  });
});
