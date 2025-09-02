import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtifactDataResponse } from "@/api/types.gen";
import type { InputSpec } from "@/utils/componentSpec";

import type { IOCellActions } from "./IOCell";
import IOCellDetails from "./IOCellDetails";

// Mock dependencies
vi.mock("@/components/ui/layout", () => ({
  BlockStack: ({ children, className, gap }: any) => (
    <div data-testid="block-stack" className={className} data-gap={gap}>
      {children}
    </div>
  ),
  InlineStack: ({ children, className }: any) => (
    <div data-testid="inline-stack" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/link", () => ({
  Link: ({ children, href, external, className }: any) => (
    <a
      data-testid="link"
      href={href}
      data-external={external}
      className={className}
    >
      {children}
    </a>
  ),
}));

vi.mock("./IOCodeViewer", () => ({
  default: ({ title, value }: any) => (
    <div data-testid="io-code-viewer" data-title={title} data-value={value}>
      Code Viewer: {title} - {value}
    </div>
  ),
}));

vi.mock("@/utils/URL", () => ({
  convertGcsUrlToBrowserUrl: (url: string, isDir: boolean) =>
    `browser-${url}-${isDir}`,
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
    expect(codeViewer).toHaveTextContent(
      "Code Viewer: test-input - test-value",
    );
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

  it("calls handleCopyValue when code viewer wrapper is clicked", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    const codeViewerWrapper =
      screen.getByTestId("io-code-viewer").parentElement;
    fireEvent.click(codeViewerWrapper!);

    expect(mockActions.handleCopyValue).toHaveBeenCalledTimes(1);
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

    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "browser-gs://bucket/path-false");
    expect(link).toHaveAttribute("data-external", "true");
    expect(link).toHaveTextContent("gs://bucket/path");
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
    expect(screen.queryByTestId("link")).not.toBeInTheDocument();
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
    expect(screen.queryByTestId("link")).not.toBeInTheDocument();
  });

  it("renders both value and URI sections when both exist", () => {
    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    expect(screen.getByTestId("io-code-viewer")).toBeInTheDocument();
    expect(screen.getByText("URI:")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toBeInTheDocument();
  });

  it("handles directory URIs correctly", () => {
    const dirArtifactData = { ...mockArtifactData, is_dir: true };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={dirArtifactData}
        actions={mockActions}
      />,
    );

    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute("href", "browser-gs://bucket/path-true");
  });

  it("renders with different input types", () => {
    const numberInputSpec = { name: "number-input", type: "Integer" as const };

    render(
      <IOCellDetails
        io={numberInputSpec}
        artifactData={mockArtifactData}
        actions={mockActions}
      />,
    );

    const codeViewer = screen.getByTestId("io-code-viewer");
    expect(codeViewer).toHaveAttribute("data-title", "number-input");
  });

  it("handles complex URIs correctly", () => {
    const complexArtifactData = {
      ...mockArtifactData,
      uri: "gs://my-bucket/very/long/path/to/file.json",
      is_dir: false,
    };

    render(
      <IOCellDetails
        io={mockInputSpec}
        artifactData={complexArtifactData}
        actions={mockActions}
      />,
    );

    const link = screen.getByTestId("link");
    expect(link).toHaveAttribute(
      "href",
      "browser-gs://my-bucket/very/long/path/to/file.json-false",
    );
    expect(link).toHaveTextContent(
      "gs://my-bucket/very/long/path/to/file.json",
    );
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
    expect(screen.getByTestId("link")).toBeInTheDocument();
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
    expect(screen.queryByTestId("link")).not.toBeInTheDocument();
  });
});
