import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installSource } from "@/config/bannerTestSource";

import { BannerInbox } from "./BannerInbox";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("<BannerInbox />", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    delete window.__TANGLE_BANNER_SOURCE__;
  });

  it("renders nothing when there are no banners", () => {
    const { container } = render(<BannerInbox />);

    expect(container).toBeEmptyDOMElement();
  });

  it("counts the banners the reader has not opened yet", () => {
    installSource([
      { id: "a", title: "One", body: "" },
      { id: "b", title: "Two", body: "" },
    ]);

    render(<BannerInbox />);

    expect(screen.getByTestId("banner-inbox-unread")).toHaveTextContent("2");
    expect(screen.getByTestId("banner-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 2 unread",
    );
  });

  it("lists every banner in full once opened", () => {
    installSource([
      { id: "a", title: "One", body: "Body of **one**" },
      { id: "b", title: "Two", body: "Body of two" },
    ]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(screen.getByTestId("banner-inbox")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-box-title")).toHaveLength(2);
    expect(screen.getByText("one").tagName).toBe("STRONG");
    expect(screen.getByText(/Body of two/)).toBeInTheDocument();
  });

  it("clears the unread count once opened, and keeps it clear across a remount", () => {
    installSource([{ id: "a", title: "One", body: "" }]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(screen.queryByTestId("banner-inbox-unread")).not.toBeInTheDocument();

    cleanup();
    render(<BannerInbox />);

    expect(screen.queryByTestId("banner-inbox-unread")).not.toBeInTheDocument();
    expect(screen.getByTestId("banner-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 1 active",
    );
  });

  it("lets a dismissible banner be removed from the centre for good", () => {
    installSource([
      { id: "a", title: "Optional", body: "", dismissible: true },
      { id: "b", title: "Mandatory", body: "" },
    ]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(screen.getAllByLabelText("Dismiss")).toHaveLength(1);
    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
    expect(screen.getByText("Mandatory")).toBeInTheDocument();

    cleanup();
    render(<BannerInbox />);

    expect(screen.getByTestId("banner-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 1 active",
    );
  });

  // A dismiss that cannot be persisted is held in memory for the lifetime of the
  // module, so this case needs an id no other test reuses.
  it("removes a dismissed banner even when it cannot be persisted", () => {
    installSource([
      { id: "unpersistable", title: "Optional", body: "", dismissible: true },
    ]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage is unavailable");
      });
    fireEvent.click(screen.getByLabelText("Dismiss"));
    setItem.mockRestore();

    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  });

  it("puts a hidden strip back on the page", () => {
    localStorage.setItem("hidden-banners", JSON.stringify(["a"]));
    installSource([{ id: "a", title: "One", body: "", dismissible: true }]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));
    fireEvent.click(screen.getByTestId("banner-inbox-show"));

    expect(screen.queryByTestId("banner-inbox-show")).not.toBeInTheDocument();
    expect(screen.getByTestId("banner-inbox-hide")).toBeInTheDocument();
    expect(localStorage.getItem("hidden-banners")).toBe("[]");
  });

  it("hides a showing strip from the centre, and offers to bring it back", () => {
    installSource([{ id: "a", title: "One", body: "", dismissible: true }]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(screen.queryByTestId("banner-inbox-show")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("banner-inbox-hide"));

    expect(screen.getByTestId("banner-inbox-show")).toBeInTheDocument();
    expect(localStorage.getItem("hidden-banners")).toContain("a");
  });

  it("orders the list by severity", () => {
    installSource([
      { id: "a", title: "Info", body: "", variant: "info" },
      { id: "b", title: "Error", body: "", variant: "error" },
      { id: "c", title: "Warning", body: "", variant: "warning" },
    ]);

    render(<BannerInbox />);
    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(
      screen.getAllByTestId("info-box-title").map((el) => el.textContent),
    ).toEqual(["Error", "Warning", "Info"]);
  });
});
