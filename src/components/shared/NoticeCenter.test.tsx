import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NoticeCenter } from "@/components/shared/NoticeCenter";

beforeEach(() => {
  delete window.__TANGLE_ANNOUNCEMENTS__;
});

afterEach(cleanup);

describe("NoticeCenter", () => {
  it("shows active notices in host order", () => {
    window.__TANGLE_ANNOUNCEMENTS__ = [
      {
        id: "first",
        title: "First notice",
        body: "First body",
        dismissible: true,
      },
      {
        id: "second",
        title: "Second notice",
        body: "Second body",
      },
      {
        id: "expired",
        title: "Expired notice",
        body: "Expired body",
        expiresAt: "2000-01-01",
      },
    ];

    render(<NoticeCenter />);
    fireEvent.click(screen.getByLabelText("Notices, 2 active"));

    expect(
      screen.getAllByTestId("info-box-title").map((title) => title.textContent),
    ).toEqual(["First notice", "Second notice"]);
    expect(screen.queryByText("Expired notice")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<NoticeCenter />);
    fireEvent.click(screen.getByLabelText("Notices, none active"));

    expect(screen.getByText("No active notices")).toBeVisible();
  });
});
