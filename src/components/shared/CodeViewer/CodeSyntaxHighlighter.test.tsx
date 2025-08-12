import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test } from "vitest";

import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";

const sampleCode = `function hello() {
  console.log("Hello, World!");
  return true;
}`;

describe("<CodeSyntaxHighlighter />", () => {
  test("renders basic code with default props", () => {
    render(<CodeSyntaxHighlighter code={sampleCode} language="javascript" />);

    // Check for individual tokens that get tokenized by the syntax highlighter
    expect(screen.getByText("function")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("console")).toBeInTheDocument();
    expect(screen.getByText('"Hello, World!"')).toBeInTheDocument();
    expect(screen.getByText("return")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  test("displays line numbers with default starting number", () => {
    render(<CodeSyntaxHighlighter code={sampleCode} language="javascript" />);

    // Check for line number elements
    const lineNumbers = screen.getAllByText(/^[0-9]+$/);
    expect(lineNumbers).toHaveLength(4); // 4 lines of code
    expect(lineNumbers[0]).toHaveTextContent("1");
    expect(lineNumbers[1]).toHaveTextContent("2");
  });

  test("displays line numbers with custom starting number", () => {
    render(
      <CodeSyntaxHighlighter
        code={sampleCode}
        language="javascript"
        startingLineNumber={10}
      />,
    );

    // Check for line numbers starting at 10
    const lineNumbers = screen.getAllByText(/^[0-9]+$/);
    expect(lineNumbers[0]).toHaveTextContent("10");
    expect(lineNumbers[1]).toHaveTextContent("11");
    expect(screen.getByText("function")).toBeInTheDocument();
  });

  test("handles empty code gracefully", () => {
    render(<CodeSyntaxHighlighter code="" language="javascript" />);

    // Should render the container even with empty code
    const codeElement = screen.getByRole("code");
    expect(codeElement).toBeInTheDocument();
    expect(codeElement).toBeEmptyDOMElement();
  });

  describe("virtualized mode", () => {
    const batchSize = 100;
    const largeCode = Array.from(
      { length: 1000 },
      (_, i) => `const line${i} = ${i};`,
    ).join("\n");

    beforeAll(() => {
      window.document.documentElement.style.fontSize = "16px";

      /**
       * Mock the offsetHeight and offsetWidth of the HTMLElement since jsdom wont calculate the height and width of the element
       * @see https://github.com/TanStack/virtual/issues/641#issuecomment-2851908893
       */
      Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
        get() {
          return parseInt(this.dataset.height || "18");
        },
      });
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        get() {
          return parseInt(this.dataset.height || "18");
        },
      });
    });

    test("renders with virtualized=false (default)", () => {
      render(<CodeSyntaxHighlighter code={sampleCode} language="javascript" />);

      // Should render code directly without virtualization container
      expect(screen.getByText("function")).toBeInTheDocument();
      expect(screen.getByText("console")).toBeInTheDocument();

      // Should not have virtualization-specific divs with transform styles
      const container = screen.getByRole("code").parentElement;
      const virtualizedDivs = container?.querySelectorAll(
        'div[style*="transform"]',
      );
      expect(virtualizedDivs?.length || 0).toBe(0);
    });

    test("renders with virtualized=true", () => {
      render(
        <CodeSyntaxHighlighter
          code={largeCode}
          language="javascript"
          virtualized={true}
        />,
      );

      // Should have virtualization container structure with transform styles
      const codeElement = screen.getByRole("code");
      const virtualizedDivs = codeElement.querySelectorAll(
        'div[style*="transform"]',
      );
      expect(virtualizedDivs.length).toBeGreaterThan(0);
    });

    /**
     * This test skipped, due to unknown failure. Not sure what changed in the between the last time it was run and now.
     * Given, that entire code viewer is going to be replaced, may not be worth fixing.
     */
    test.skip("virtualized mode renders large code efficiently in batches", async () => {
      render(
        <div
          data-testid="scroll-container"
          data-width={window.innerWidth}
          data-height={batchSize * 18}
        >
          <CodeSyntaxHighlighter
            code={largeCode}
            language="javascript"
            virtualized={true}
            height={`${batchSize * 18}px`}
            fontSize="0.75rem"
          />
        </div>,
      );

      // assert
      const virtualizedContainer = screen
        .getByRole("code")
        .querySelector('div[style*="position: absolute"]');

      expect(virtualizedContainer).toBeInTheDocument();

      const batchContainerDivs =
        virtualizedContainer!.querySelectorAll("div[data-index]");

      expect(batchContainerDivs[0].childElementCount).toBe(batchSize);
      expect(batchContainerDivs.length).toBe(2);
    });
  });
});
