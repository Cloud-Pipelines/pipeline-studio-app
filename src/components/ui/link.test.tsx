import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Link } from "./link";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("<Link />", () => {
  it("sits inside running text without breaking the markup", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { container } = render(
      <p>
        Read the{" "}
        <Link href="https://example.com" external>
          notes
        </Link>
        .
      </p>,
    );

    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector("a div")).toBeNull();
  });
});
