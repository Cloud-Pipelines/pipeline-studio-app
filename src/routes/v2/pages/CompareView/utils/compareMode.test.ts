import { describe, expect, it } from "vitest";

import { compareMode } from "./compareMode";

describe("compareMode", () => {
  it("is empty with no runs selected", () => {
    expect(compareMode("", "")).toEqual({ kind: "empty" });
  });

  it("reports the filled side when only one run is selected", () => {
    expect(compareMode("12", "")).toEqual({ kind: "single", side: "a" });
    expect(compareMode("", "34")).toEqual({ kind: "single", side: "b" });
  });

  it("compares two distinct runs", () => {
    expect(compareMode("12", "34")).toEqual({ kind: "both" });
  });

  it("treats the same run in both slots as a single selection", () => {
    expect(compareMode("12", "12")).toEqual({ kind: "single", side: "a" });
  });
});
