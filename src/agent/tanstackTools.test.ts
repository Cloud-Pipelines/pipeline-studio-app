import { describe, expect, it } from "vitest";

import {
  editorAgentToolDefinitions,
  getAgentContextDefinition,
  runViewAgentToolDefinitions,
} from "./tanstackTools";

function findEditorTool(name: string) {
  return editorAgentToolDefinitions.find((tool) => tool.name === name);
}

describe("TanStack agent tools", () => {
  it("requires approval for mutations and run submission", () => {
    expect(findEditorTool("set_pipeline_name")?.needsApproval).toBe(true);
    expect(findEditorTool("delete_task")?.needsApproval).toBe(true);
    expect(findEditorTool("submit_pipeline_run")?.needsApproval).toBe(true);
  });

  it("does not require approval for read-only tools", () => {
    expect(findEditorTool("get_pipeline_state")?.needsApproval).not.toBe(true);
    expect(findEditorTool("validate_pipeline")?.needsApproval).not.toBe(true);
    expect(findEditorTool("debug_pipeline_run")?.needsApproval).not.toBe(true);
  });

  it("keeps editor mutations out of the run view", () => {
    expect(runViewAgentToolDefinitions.map((tool) => tool.name)).not.toContain(
      "set_pipeline_name",
    );
  });

  it("supports server and client implementations from shared definitions", () => {
    expect(getAgentContextDefinition.server).toBeTypeOf("function");
    expect(getAgentContextDefinition.client).toBeTypeOf("function");
  });
});
