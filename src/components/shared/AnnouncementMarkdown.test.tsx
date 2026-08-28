import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnnouncementMarkdown } from "@/components/shared/AnnouncementMarkdown";

afterEach(cleanup);

describe("AnnouncementMarkdown", () => {
  it("renders formatting and absolute HTTP links", () => {
    render(
      <AnnouncementMarkdown>
        {
          "Read the **important** [migration guide](https://example.com/migration)."
        }
      </AnnouncementMarkdown>,
    );

    expect(screen.getByText("important").tagName).toBe("STRONG");
    expect(
      screen.getByRole("link", { name: /migration guide/i }),
    ).toHaveAttribute("href", "https://example.com/migration");
  });

  it("does not render unsafe or relative links", () => {
    render(
      <AnnouncementMarkdown>
        {"[Unsafe](javascript:alert(1)) [Relative](/settings)"}
      </AnnouncementMarkdown>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Unsafe Relative")).toBeVisible();
  });
});
