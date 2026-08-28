import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AnnouncementBanners } from "@/components/shared/AnnouncementBanners";

beforeEach(() => {
  delete window.__TANGLE_ANNOUNCEMENTS__;
  localStorage.clear();
});

afterEach(cleanup);

describe("AnnouncementBanners", () => {
  it("dismisses a configured announcement from the dashboard", () => {
    window.__TANGLE_ANNOUNCEMENTS__ = [
      {
        id: "notice",
        title: "Active notification",
        body: "Notification body",
        dismissible: true,
      },
    ];

    render(<AnnouncementBanners />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Active notification")).not.toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem("dismissed-announcements") ?? "[]"),
    ).toEqual(["notice"]);
  });

  it("does not dismiss an announcement unless configured", () => {
    window.__TANGLE_ANNOUNCEMENTS__ = [
      {
        id: "notice",
        title: "Required notification",
        body: "Notification body",
      },
    ];

    render(<AnnouncementBanners />);

    expect(screen.getByText("Required notification")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Dismiss" }),
    ).not.toBeInTheDocument();
  });
});
