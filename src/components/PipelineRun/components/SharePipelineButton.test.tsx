import { screen } from "@testing-library/dom";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SharePipelineButton } from "./SharePipelineButton";

const mockNotify = vi.fn();

vi.mock("@/hooks/useToastNotification", () => ({
  default: () => mockNotify,
}));

describe("<SharePipelineButton/>", () => {
  test("copies the current URL to the clipboard on click", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<SharePipelineButton />);
    act(() => fireEvent.click(screen.getByTestId("share-pipeline-button")));

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(mockNotify).toHaveBeenCalledWith(
      "Run URL copied to clipboard",
      "success",
    );
  });
});
