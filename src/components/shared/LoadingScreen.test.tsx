import { act, cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { LOADING_ACTION_DELAY_MS, LoadingScreen } from "./LoadingScreen";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  Link: ({ to, children }: ComponentProps<"a"> & { to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("LoadingScreen", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("renders the message", () => {
    render(<LoadingScreen message="Loading Pipeline" />);

    expect(screen.getByText("Loading Pipeline")).toBeInTheDocument();
  });

  test("does not show the return-home action before the delay", () => {
    vi.useFakeTimers();
    render(<LoadingScreen message="Loading Pipeline" />);

    act(() => {
      vi.advanceTimersByTime(LOADING_ACTION_DELAY_MS - 1);
    });

    expect(screen.queryByText("Stuck loading?")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Return home" }),
    ).not.toBeInTheDocument();
  });

  test("reveals the return-home link after the delay", () => {
    vi.useFakeTimers();
    render(<LoadingScreen message="Loading Pipeline" />);

    act(() => {
      vi.advanceTimersByTime(LOADING_ACTION_DELAY_MS);
    });

    expect(screen.getByText("Stuck loading?")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Return home" });
    expect(link).toHaveAttribute("href", "/");
  });
});
