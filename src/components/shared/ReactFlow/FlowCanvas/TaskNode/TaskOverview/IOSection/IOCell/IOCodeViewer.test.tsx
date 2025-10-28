import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import IOCodeViewer from "./IOCodeViewer";

// Mock dependencies
vi.mock("@/components/shared/CodeViewer", () => ({
  CodeViewer: ({ code, language, filename }: any) => (
    <div
      data-testid="code-viewer"
      data-language={language}
      data-filename={filename}
    >
      {code}
    </div>
  ),
}));

describe("IOCodeViewer", () => {
  it("renders plain text for non-JSON strings", () => {
    render(<IOCodeViewer title="test-title" value="plain text value" />);

    const preElement = screen.getByText("plain text value");
    expect(preElement).toBeInTheDocument();
    expect(preElement.tagName).toBe("PRE");
    expect(screen.queryByTestId("code-viewer")).not.toBeInTheDocument();
  });

  it("renders CodeViewer for valid JSON strings", () => {
    const jsonValue = '{"key": "value"}';
    render(<IOCodeViewer title="json-title" value={jsonValue} />);

    const codeViewer = screen.getByTestId("code-viewer");
    expect(codeViewer).toBeInTheDocument();
    expect(codeViewer).toHaveAttribute("data-language", "json");
    expect(codeViewer).toHaveAttribute("data-filename", "json-title");
    expect(
      screen.queryByRole("generic", { name: /pre/i }),
    ).not.toBeInTheDocument();
  });

  it("handles JSON array strings", () => {
    const arrayValue = '["item1", "item2", "item3"]';
    render(<IOCodeViewer title="array-title" value={arrayValue} />);

    const codeViewer = screen.getByTestId("code-viewer");
    expect(codeViewer).toBeInTheDocument();
    expect(codeViewer).toHaveAttribute("data-language", "json");
    expect(codeViewer).toHaveAttribute("data-filename", "array-title");
  });

  it("calculates correct height for short JSON", () => {
    const shortJson = '{"key": "value"}';
    render(<IOCodeViewer title="short" value={shortJson} />);

    const container = screen.getByTestId("code-viewer").parentElement;
    // 3 lines * 31px + 55px header = 117px
    expect(container).toHaveStyle({ height: "148px" });
  });

  it("limits height to maximum lines for long JSON", () => {
    const longJson = JSON.stringify(
      {
        line1: "value1",
        line2: "value2",
        line3: "value3",
        line4: "value4",
        line5: "value5",
        line6: "value6",
        line7: "value7",
        line8: "value8",
        line9: "value9",
        line10: "value10",
        line11: "value11",
        line12: "value12",
        line13: "value13",
        line14: "value14",
        line15: "value15",
      },
      null,
      2,
    );

    render(<IOCodeViewer title="long" value={longJson} />);

    const container = screen.getByTestId("code-viewer").parentElement;
    // Max 10 lines * 31px + 55px header = 365px
    expect(container).toHaveStyle({ height: "365px" });
  });

  it("falls back to plain text for malformed JSON", () => {
    const malformedJson = '{"key": "value"'; // Missing closing brace
    render(<IOCodeViewer title="malformed" value={malformedJson} />);

    const preElement = screen.getByText(malformedJson);
    expect(preElement).toBeInTheDocument();
    expect(preElement.tagName).toBe("PRE");
    expect(screen.queryByTestId("code-viewer")).not.toBeInTheDocument();
  });

  it("handles empty string as plain text", () => {
    render(<IOCodeViewer title="empty" value="" />);

    const preElement = screen.getByText("No value");
    expect(preElement).toBeInTheDocument();
    expect(preElement.tagName).toBe("PRE");
    expect(screen.queryByTestId("code-viewer")).not.toBeInTheDocument();
  });

  it("handles number strings as JSON", () => {
    render(<IOCodeViewer title="number" value="42" />);

    const codeViewer = screen.getByTestId("code-viewer");
    expect(codeViewer).toBeInTheDocument();
    expect(codeViewer).toHaveAttribute("data-language", "json");
  });

  it("passes correct props to CodeViewer", () => {
    const jsonValue = '{"test": "data"}';
    render(<IOCodeViewer title="my-title" value={jsonValue} />);

    const codeViewer = screen.getByTestId("code-viewer");
    expect(codeViewer).toHaveAttribute("data-filename", "my-title");
    expect(codeViewer).toHaveAttribute("data-language", "json");
  });
});
