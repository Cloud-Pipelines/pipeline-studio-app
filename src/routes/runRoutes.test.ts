import { describe, expect, it } from "vitest";

import { getDefaultRunPath, getRunPath } from "./runRoutes";

describe("run routes", () => {
  it("builds run paths, including subgraph executions", () => {
    expect(getRunPath("run 1")).toBe("/runs/run%201");
    expect(getRunPath("run 1", "subgraph 1")).toBe(
      "/runs/run%201/subgraph%201",
    );
  });

  it("uses the canonical run route by default", () => {
    expect(getDefaultRunPath("run-1")).toBe("/runs/run-1");
  });
});
