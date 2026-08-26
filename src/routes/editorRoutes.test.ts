import { describe, expect, it } from "vitest";

import { getDefaultEditorPath } from "./editorRoutes";

describe("editor routes", () => {
  it("builds editor paths with encoded pipeline names", () => {
    expect(getDefaultEditorPath("Pipeline 1")).toBe("/editor/Pipeline%201");
  });
});
