import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installRawSource, installSource } from "@/config/bannerTestSource";
import { closeBannerInbox } from "@/hooks/useBannerInbox";
import { CONTENT_OFFSET_VAR } from "@/utils/constants";

import { BannerInbox } from "./BannerInbox";
import { BannerRegion } from "./BannerRegion";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

function contentOffset() {
  return document.documentElement.style.getPropertyValue(CONTENT_OFFSET_VAR);
}

describe("<BannerRegion />", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    closeBannerInbox();
    delete window.__TANGLE_BANNER_SOURCE__;
    document.documentElement.style.removeProperty(CONTENT_OFFSET_VAR);
  });

  it("renders no DOM node when no source is installed", () => {
    const { container } = render(<BannerRegion />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("banner-region")).not.toBeInTheDocument();
  });

  it("renders no DOM node when the source declares an unsupported version", () => {
    installRawSource({
      version: 2,
      getSnapshot: () => [{ id: "a", title: "Later contract", body: "" }],
      subscribe: () => () => {},
    });

    const { container } = render(<BannerRegion />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a source that rebuilds its array on every read", () => {
    const banners = [{ id: "a", title: "Scheduled maintenance", body: "" }];
    installRawSource({
      version: 1,
      getSnapshot: () => banners.map((banner) => ({ ...banner })),
      subscribe: () => () => {},
    });

    render(<BannerRegion />);

    expect(screen.getByText("Scheduled maintenance")).toBeInTheDocument();
  });

  it("promotes every showing banner rather than capping the strip", () => {
    installSource(
      ["a", "b", "c", "d", "e", "f"].map((id) => ({
        id,
        title: `Notice ${id}`,
        body: "",
        variant: "error" as const,
      })),
    );

    render(<BannerRegion />);

    expect(screen.getAllByTestId("banner-card")).toHaveLength(6);
    expect(screen.getByText("Notice f")).toBeInTheDocument();
  });

  it("promotes the cards in severity order", () => {
    installSource([
      { id: "a", title: "Nice to know", body: "", variant: "info" },
      { id: "b", title: "Worked", body: "", variant: "success" },
      { id: "c", title: "Everything is broken", body: "", variant: "error" },
      { id: "d", title: "Heads up", body: "", variant: "warning" },
    ]);

    render(<BannerRegion />);

    expect(
      screen.getAllByTestId("info-box-title").map((el) => el.textContent),
    ).toEqual(["Everything is broken", "Heads up", "Worked", "Nice to know"]);
  });

  it("puts the scrolling zone in the tab order so its overflow stays reachable", () => {
    installSource([
      { id: "a", title: "One", body: "", variant: "error" },
      { id: "b", title: "Two", body: "", variant: "warning" },
    ]);

    render(<BannerRegion />);

    const scroller = screen.getByTestId("banner-scroller");
    expect(scroller).toHaveAttribute("tabindex", "0");
    expect(scroller).toContainElement(screen.getAllByTestId("banner-card")[1]);
  });

  it("leaves opening the full list to the header, with no button of its own", () => {
    installSource([{ id: "a", title: "Only notice", body: "" }]);

    render(<BannerRegion />);

    expect(screen.getByTestId("banner-controls")).toBeInTheDocument();
    expect(screen.queryByTestId("banner-open-inbox")).not.toBeInTheDocument();
  });

  it("renders a brief body inline as Markdown", () => {
    installSource([
      {
        id: "a",
        title: "Scheduled maintenance",
        body: "Submissions paused **09:00-11:00 UTC**.",
      },
    ]);

    render(<BannerRegion />);

    expect(screen.getByText("09:00-11:00 UTC").tagName).toBe("STRONG");
  });

  it("renders a body-only banner without reserving room for a title", () => {
    installSource([{ id: "a", title: "", body: "Submissions are paused." }]);

    render(<BannerRegion />);

    expect(screen.getByText("Submissions are paused.")).toBeInTheDocument();
    expect(screen.queryByTestId("info-box-title")).not.toBeInTheDocument();
  });

  it("renders a long body inline rather than truncating it", () => {
    installSource([
      {
        id: "a",
        title: "Release notes",
        body: `Line one\n\n${"detail ".repeat(40)}`,
      },
    ]);

    render(<BannerRegion />);

    expect(screen.getByText("Line one")).toBeInTheDocument();
  });

  it("does not render raw HTML embedded in the body", () => {
    installSource([
      {
        id: "a",
        title: "Notice",
        body: "<script>window.__bannerXss = true;</script><b>bold</b>",
      },
    ]);

    const { container } = render(<BannerRegion />);

    expect(container.querySelector("script")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.queryByText("bold")).not.toBeInTheDocument();
    expect(
      (window as unknown as Record<string, unknown>).__bannerXss,
    ).toBeUndefined();
  });

  it("renders an action link with an accessible name that includes the title", () => {
    installSource([
      {
        id: "a",
        title: "Scheduled maintenance",
        body: "",
        action: { url: "https://example.com/notes", text: "Read the notes" },
      },
    ]);

    render(<BannerRegion />);

    const link = screen.getByRole("link", {
      name: "Read the notes: Scheduled maintenance",
    });

    expect(link).toHaveAttribute("href", "https://example.com/notes");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("leaves the banner itself with no dismiss control", () => {
    installSource([
      { id: "a", title: "Scheduled maintenance", body: "", dismissible: true },
    ]);

    render(<BannerRegion />);

    expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
    expect(screen.getByTestId("banner-hide-strip")).toBeInTheDocument();
  });

  it("hides its controls while the inbox is open, without giving up their space", () => {
    installSource([
      { id: "a", title: "One", body: "", variant: "error" },
      { id: "b", title: "Two", body: "", variant: "info" },
    ]);

    render(
      <>
        <BannerInbox />
        <BannerRegion />
      </>,
    );
    expect(screen.getByTestId("banner-controls")).not.toHaveClass("invisible");

    fireEvent.click(screen.getByTestId("banner-inbox-trigger"));

    expect(screen.getByTestId("banner-controls")).toHaveClass("invisible");
    expect(screen.getByTestId("banner-region")).toBeInTheDocument();
  });

  it("clears the whole strip in one go rather than promoting the next banner", () => {
    installSource([
      {
        id: "a",
        title: "First",
        body: "",
        variant: "error",
        dismissible: true,
      },
      {
        id: "b",
        title: "Second",
        body: "",
        variant: "warning",
        dismissible: true,
      },
    ]);

    render(<BannerRegion />);
    fireEvent.click(screen.getByTestId("banner-hide-strip"));

    expect(screen.queryByTestId("banner-region")).not.toBeInTheDocument();
  });

  it("keeps a hidden dismissible banner off the strip across a remount", () => {
    installSource([
      { id: "a", title: "Scheduled maintenance", body: "", dismissible: true },
    ]);

    render(<BannerRegion />);
    fireEvent.click(screen.getByTestId("banner-hide-strip"));

    cleanup();
    const { container } = render(<BannerRegion />);

    expect(container).toBeEmptyDOMElement();
  });

  // The session-scoped half of the hide is module state, so this banner needs an
  // id no other test reuses.
  it("hides a non-dismissible banner without retiring it for good", () => {
    installSource([{ id: "mandatory", title: "Mandatory notice", body: "" }]);

    render(<BannerRegion />);
    fireEvent.click(screen.getByTestId("banner-hide-strip"));

    expect(screen.queryByTestId("banner-region")).not.toBeInTheDocument();
    expect(localStorage.getItem("hidden-banners") ?? "").not.toContain(
      "mandatory",
    );
  });

  it("publishes a content offset while a banner is promoted", () => {
    installSource([
      { id: "a", title: "Scheduled maintenance", body: "", dismissible: true },
    ]);

    render(<BannerRegion />);
    expect(contentOffset()).not.toBe("");

    fireEvent.click(screen.getByTestId("banner-hide-strip"));

    expect(contentOffset()).toBe("");
  });

  it("picks up a source installed after mount", () => {
    render(<BannerRegion />);

    expect(screen.queryByTestId("banner-region")).not.toBeInTheDocument();

    act(() => {
      installSource([{ id: "a", title: "Scheduled maintenance", body: "" }]);
    });

    expect(screen.getByText("Scheduled maintenance")).toBeInTheDocument();
  });
});
