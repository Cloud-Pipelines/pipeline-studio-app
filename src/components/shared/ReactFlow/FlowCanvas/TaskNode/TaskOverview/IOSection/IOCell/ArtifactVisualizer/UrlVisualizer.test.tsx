import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UrlVisualizerValue } from "./UrlVisualizer";

const mockNotify = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useToastNotification", () => ({
  default: () => mockNotify,
}));

beforeEach(() => {
  mockNotify.mockClear();
});

describe("UrlVisualizerValue", () => {
  it("renders the value as an external link", () => {
    render(<UrlVisualizerValue value="https://example.com/report" />);

    const link = screen.getByRole("link", {
      name: /https:\/\/example\.com\/report/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/report");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("copies the URL and notifies on copy click", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<UrlVisualizerValue value="https://example.com/report" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy URL" }));

    expect(writeText).toHaveBeenCalledWith("https://example.com/report");
    expect(mockNotify).toHaveBeenCalledWith(
      "URL copied to clipboard",
      "success",
    );
  });

  it("shows the raw value instead of a link when it is not a valid URL", () => {
    render(<UrlVisualizerValue value="not a url" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Not a valid URL")).toBeInTheDocument();
    expect(screen.getByText("not a url")).toBeInTheDocument();
  });

  it("does not link a javascript: value", () => {
    render(<UrlVisualizerValue value="javascript:alert(1)" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows 'No data' for an empty value", () => {
    render(<UrlVisualizerValue value="   " />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
