import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { FullscreenElement } from "./FullscreenElement";

describe("FullscreenElement", () => {
  test("renders children in normal mode (not fullscreen)", () => {
    render(
      <FullscreenElement fullscreen={false}>
        <div data-testid="test-content">Test Content</div>
      </FullscreenElement>,
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  test("renders children in fullscreen mode", () => {
    render(
      <FullscreenElement fullscreen={true}>
        <div data-testid="test-content">Fullscreen Content</div>
      </FullscreenElement>,
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  test("appends container to document.body in fullscreen mode", () => {
    render(
      <FullscreenElement fullscreen={true}>
        <div data-testid="fullscreen-content">Fullscreen</div>
      </FullscreenElement>,
    );

    const fullscreenContainer = screen.getByTestId("fullscreen-container");

    expect(fullscreenContainer.parentElement).toBe(document.body);

    expect(screen.getByTestId("fullscreen-content")).toBeInTheDocument();
  });

  test("switches from normal to fullscreen mode", () => {
    const { rerender } = render(
      <FullscreenElement fullscreen={false}>
        <div data-testid="switching-content">Content</div>
      </FullscreenElement>,
    );

    const switchingContentA = screen.getByTestId("switching-content");

    const elementMountingPoint = screen.getByTestId(
      "fullscreen-element-mounting-point",
    );
    const fullscreenContainer = screen.getByTestId("fullscreen-container");

    expect(fullscreenContainer).toBeInTheDocument();
    expect(fullscreenContainer.parentElement).toBe(elementMountingPoint);
    expect(fullscreenContainer).toHaveClass("contents");
    expect(fullscreenContainer).toHaveClass("pointer-events-auto");

    rerender(
      <FullscreenElement fullscreen={true}>
        <div data-testid="switching-content">Content</div>
      </FullscreenElement>,
    );

    const switchingContentB = screen.getByTestId("switching-content");

    expect(switchingContentA).toStrictEqual(switchingContentB);

    expect(fullscreenContainer).toBeInTheDocument();
    expect(fullscreenContainer.parentElement).toBe(document.body);
    expect(fullscreenContainer).toHaveClass("fixed");
    expect(fullscreenContainer).toHaveClass("z-[2147483647]");
  });

  test("switches from fullscreen to normal mode", () => {
    const { rerender } = render(
      <FullscreenElement fullscreen={true}>
        <div data-testid="switching-content">Content</div>
      </FullscreenElement>,
    );

    const switchingContentA = screen.getByTestId("switching-content");

    const elementMountingPoint = screen.getByTestId(
      "fullscreen-element-mounting-point",
    );
    const fullscreenContainer = screen.getByTestId("fullscreen-container");

    expect(fullscreenContainer).toBeInTheDocument();
    expect(fullscreenContainer.parentElement).toBe(document.body);
    expect(fullscreenContainer).toHaveClass("fixed");
    expect(fullscreenContainer).toHaveClass("z-[2147483647]");

    rerender(
      <FullscreenElement fullscreen={false}>
        <div data-testid="switching-content">Content</div>
      </FullscreenElement>,
    );

    const switchingContentB = screen.getByTestId("switching-content");

    expect(switchingContentA).toStrictEqual(switchingContentB);

    expect(fullscreenContainer).toBeInTheDocument();
    expect(fullscreenContainer.parentElement).toBe(elementMountingPoint);
    expect(fullscreenContainer).toHaveClass("contents");
    expect(fullscreenContainer).toHaveClass("pointer-events-auto");
  });

  test("cleans up container when unmounting from fullscreen mode", () => {
    const { unmount } = render(
      <FullscreenElement fullscreen={true}>
        <div data-testid="cleanup-content">Content</div>
      </FullscreenElement>,
    );

    const fullscreenContainer = screen.getByTestId("fullscreen-container");

    unmount();

    expect(fullscreenContainer).not.toBeInTheDocument();
  });
});
