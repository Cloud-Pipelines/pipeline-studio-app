import { describe, expect, it } from "vitest";

import { getRunSuggestedPrompts } from "./useAiChatWindow";

const labelsFor = (status: string | undefined) =>
  getRunSuggestedPrompts(status).map((prompt) => prompt.label);

describe("getRunSuggestedPrompts", () => {
  it("always offers the summarize prompt first", () => {
    const statuses = [
      undefined,
      "RUNNING",
      "SUCCEEDED",
      "FAILED",
      "CANCELLED",
      "SKIPPED",
    ];

    for (const status of statuses) {
      expect(labelsFor(status)[0]).toBe("Summarize this run");
    }
  });

  it.each(["FAILED", "SYSTEM_ERROR", "INVALID"])(
    "offers failure prompts for %s",
    (status) => {
      expect(labelsFor(status)).toEqual([
        "Summarize this run",
        "Why did this run fail?",
        "Which tasks failed and why?",
      ]);
    },
  );

  it.each([
    "RUNNING",
    "PENDING",
    "QUEUED",
    "WAITING_FOR_UPSTREAM",
    "CANCELLING",
    "UNINITIALIZED",
  ])("offers in-progress prompts for %s", (status) => {
    expect(labelsFor(status)).toEqual([
      "Summarize this run",
      "What's happening in this run right now?",
      "Which tasks are still running?",
    ]);
  });

  it.each(["CANCELLED", "SKIPPED"])(
    "offers halted-run prompts for %s",
    (status) => {
      expect(labelsFor(status)).toEqual([
        "Summarize this run",
        "What completed before this run stopped?",
        "Which tasks did not run?",
      ]);
    },
  );

  it("falls back to outcome prompts for succeeded and unknown statuses", () => {
    const expected = [
      "Summarize this run",
      "Explain the outputs of this run",
      "Did anything unexpected happen?",
    ];

    expect(labelsFor("SUCCEEDED")).toEqual(expected);
    expect(labelsFor(undefined)).toEqual(expected);
  });
});
