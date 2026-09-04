import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Markdown, UntrustedMarkdown } from "./Markdown";

function fontClasses(element: HTMLElement) {
  return element.className
    .split(" ")
    .filter((name) => name.startsWith("text-"));
}

describe("<Markdown />", () => {
  afterEach(cleanup);

  it("gives headings a visible hierarchy", () => {
    render(<Markdown body={"# One\n\n## Two\n\n### Three\n\n#### Four"} />);

    const [h1, h2, h3, h4] = ["One", "Two", "Three", "Four"].map((text) =>
      screen.getByText(text),
    );

    expect(h1.tagName).toBe("H1");
    expect(h4.tagName).toBe("H4");
    expect(fontClasses(h1)).toContain("text-lg");
    expect(fontClasses(h2)).toContain("text-base");
    expect(fontClasses(h3)).toContain("text-sm");
    expect(h1.className).toContain("font-bold");
    expect(h2.className).toContain("font-semibold");
  });

  it("renders a fenced block as a block, not a run of inline pills", () => {
    const { container } = render(
      <Markdown body={"```js\nconst a = 1;\nconst b = 2;\n```"} />,
    );

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toContain("overflow-x-auto");
    expect(pre?.querySelector("code")).not.toBeNull();
    expect(pre?.textContent).toContain("const b = 2;");
    expect(pre?.className).toContain("[&>code]:block");
  });

  it("renders an unlabelled fence the same way as a labelled one", () => {
    const { container } = render(<Markdown body={"```\nplain text\n```"} />);

    expect(container.querySelector("pre")?.className).toContain(
      "[&>code]:block",
    );
    expect(container.querySelector("pre code")?.textContent).toContain(
      "plain text",
    );
  });

  it("renders GFM tables with delineated rows", () => {
    const { container } = render(
      <Markdown body={"| a | b |\n| --- | --- |\n| 1 | 2 |"} />,
    );

    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("thead")?.className).toContain(
      "bg-muted/50",
    );
    expect(container.querySelector("tr")?.className).toContain("border-b");
    expect(container.querySelector("td")?.className).toContain("px-2");
  });

  it("drops the bullet from a task list item", () => {
    const { container } = render(
      <Markdown body={"- [ ] pending\n- [x] done"} />,
    );

    expect(container.querySelector("li")?.className).toContain("list-none");
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
      2,
    );
  });

  it("does not render raw HTML", () => {
    const { container } = render(
      <Markdown body={"<script>window.__mdXss = true;</script><b>bold</b>"} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(screen.queryByText("bold")).not.toBeInTheDocument();
    expect(
      (window as unknown as Record<string, unknown>).__mdXss,
    ).toBeUndefined();
  });

  it("renders an image and keeps a relative link", () => {
    const { container } = render(
      <Markdown body={"![Chart](/local.png) and [runs](/runs)"} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "/local.png");
    expect(screen.getByRole("link", { name: "runs" })).toHaveAttribute(
      "href",
      "/runs",
    );
  });

  it("keeps an internal link in the same tab and sends an external one out", () => {
    render(
      <Markdown body={"[runs](/runs) and [docs](https://example.com/docs)"} />,
    );

    const internal = screen.getByRole("link", { name: "runs" });
    expect(internal).not.toHaveAttribute("target");
    expect(internal).not.toHaveAttribute("rel");
    expect(internal.querySelector("svg")).toBeNull();

    const external = screen.getByRole("link", { name: "docs" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(external.querySelector("svg")).not.toBeNull();
  });

  it("renders links through the design system, inline with the text", () => {
    const { container } = render(
      <Markdown body="Read the [notes](https://example.com/docs) today." />,
    );

    const link = screen.getByRole("link", { name: "notes" });
    expect(link.className).toContain("inline-flex");
    expect(container.querySelector("p a")).toBe(link);
    expect(container.querySelector("a div")).toBeNull();
  });

  it("lets a caller override a base element", () => {
    render(
      <Markdown
        body="text"
        components={{
          p: ({ children }) => <div data-testid="custom">{children}</div>,
        }}
      />,
    );

    expect(screen.getByTestId("custom")).toHaveTextContent("text");
  });
});

describe("<UntrustedMarkdown />", () => {
  afterEach(cleanup);

  it("shows an image's alt text without requesting the image", () => {
    const { container } = render(
      <UntrustedMarkdown
        body={"![Diagram of the outage](https://elsewhere.example/pixel.png)"}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Diagram of the outage")).toBeInTheDocument();
  });

  it("renders an absolute http link as an external anchor", () => {
    render(<UntrustedMarkdown body="[docs](https://example.com/docs)" />);

    const link = screen.getByRole("link", { name: "docs" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a rejected link as plain text rather than a dead anchor", () => {
    const { container } = render(
      <UntrustedMarkdown
        body={"[script](javascript:alert(1)) and [relative](/runs)"}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("script and relative");
  });

  it("cannot have its image guard overridden by a caller", () => {
    const { container } = render(
      <UntrustedMarkdown
        body={"![Diagram](https://elsewhere.example/pixel.png)"}
        components={{
          img: ({ src }) => <img src={src} data-testid="leaked" alt="" />,
        }}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Diagram")).toBeInTheDocument();
  });
});
