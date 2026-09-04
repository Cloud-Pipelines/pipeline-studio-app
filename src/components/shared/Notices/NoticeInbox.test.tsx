import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installSource } from "@/config/noticeTestSource";
import { resetNoticeInboxForTests } from "@/hooks/useNoticeInbox";
import { resetNoticeStateForTests } from "@/hooks/useNotices";

import { NoticeInbox } from "./NoticeInbox";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("<NoticeInbox />", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    delete window.__TANGLE_NOTICE_SOURCE__;
    resetNoticeInboxForTests();
    resetNoticeStateForTests();
  });

  it("stays in the header with nothing to show", () => {
    render(<NoticeInbox />);

    const trigger = screen.getByTestId("notice-inbox-trigger");
    expect(trigger).toHaveAttribute("aria-label", "Notices, none");
    expect(screen.queryByTestId("notice-inbox-unread")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByTestId("notice-inbox-empty")).toHaveTextContent(
      "No notices",
    );
    expect(screen.queryByTestId("notice-inbox-hide")).not.toBeInTheDocument();
  });

  it("counts the notices the reader has not opened yet", () => {
    installSource([
      { id: "a", title: "One", body: "" },
      { id: "b", title: "Two", body: "" },
    ]);

    render(<NoticeInbox />);

    expect(screen.getByTestId("notice-inbox-unread")).toHaveTextContent("2");
    expect(screen.getByTestId("notice-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 2 unread",
    );
  });

  it("lists every notice in full once opened", () => {
    installSource([
      { id: "a", title: "One", body: "Body of **one**" },
      { id: "b", title: "Two", body: "Body of two" },
    ]);

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    expect(screen.getByTestId("notice-inbox")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-box-title")).toHaveLength(2);
    expect(screen.getByText("one").tagName).toBe("STRONG");
    expect(screen.getByText(/Body of two/)).toBeInTheDocument();
  });

  it("clears the unread count once opened, and keeps it clear across a remount", () => {
    installSource([{ id: "a", title: "One", body: "" }]);

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    expect(screen.queryByTestId("notice-inbox-unread")).not.toBeInTheDocument();

    cleanup();
    render(<NoticeInbox />);

    expect(screen.queryByTestId("notice-inbox-unread")).not.toBeInTheDocument();
    expect(screen.getByTestId("notice-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 1 active",
    );
  });

  it("lets a dismissible notice be removed from the centre for good", () => {
    installSource([
      { id: "a", title: "Optional", body: "", dismissible: true },
      { id: "b", title: "Mandatory", body: "" },
    ]);

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    expect(screen.getAllByLabelText("Dismiss")).toHaveLength(1);
    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
    expect(screen.getByText("Mandatory")).toBeInTheDocument();

    cleanup();
    render(<NoticeInbox />);

    expect(screen.getByTestId("notice-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 1 active",
    );
  });

  it("removes a dismissed notice even when it cannot be persisted", () => {
    installSource([
      { id: "a", title: "Optional", body: "", dismissible: true },
    ]);

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage is unavailable");
      });
    fireEvent.click(screen.getByLabelText("Dismiss"));
    setItem.mockRestore();

    expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  });

  it("clears the unread count for the session even when it cannot be persisted", () => {
    installSource([{ id: "a", title: "One", body: "" }]);

    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage is unavailable");
      });

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    expect(screen.queryByTestId("notice-inbox-unread")).not.toBeInTheDocument();

    cleanup();
    render(<NoticeInbox />);
    setItem.mockRestore();

    expect(screen.queryByTestId("notice-inbox-unread")).not.toBeInTheDocument();
  });

  it("keeps the centre open and reachable after the last notice goes", () => {
    installSource([
      { id: "a", title: "Optional", body: "", dismissible: true },
    ]);

    render(<NoticeInbox />);
    const trigger = screen.getByTestId("notice-inbox-trigger");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(screen.getByTestId("notice-inbox-empty")).toHaveTextContent(
      "No notices",
    );
    expect(screen.queryByTestId("notice-inbox-hide")).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId("notice-inbox"), { key: "Escape" });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByTestId("notice-inbox-empty")).toBeInTheDocument();
  });

  it("caps the unread badge, keeping the exact count on the trigger", () => {
    installSource(
      Array.from({ length: 12 }, (_, index) => ({
        id: `notice-${index}`,
        title: `Notice ${index}`,
        body: "",
      })),
    );

    render(<NoticeInbox />);

    expect(screen.getByTestId("notice-inbox-unread")).toHaveTextContent("9+");
    expect(screen.getByTestId("notice-inbox-trigger")).toHaveAttribute(
      "aria-label",
      "Notices, 12 unread",
    );
  });

  it("orders the list by severity", () => {
    installSource([
      { id: "a", title: "Info", body: "", variant: "info" },
      { id: "b", title: "Error", body: "", variant: "error" },
      { id: "c", title: "Warning", body: "", variant: "warning" },
    ]);

    render(<NoticeInbox />);
    fireEvent.click(screen.getByTestId("notice-inbox-trigger"));

    expect(
      screen.getAllByTestId("info-box-title").map((el) => el.textContent),
    ).toEqual(["Error", "Warning", "Info"]);
  });
});
