import { describe, expect, it, vi } from "vitest";

import type { NodeCallbacks } from "@/types/taskNode";
import { DEFAULT_TASK_NODE_CALLBACKS } from "@/types/taskNode";
import type { ComponentReference } from "@/utils/componentSpec";

import { generateDynamicNodeCallbacks } from "./generateDynamicNodeCallbacks";

const createNodeCallbacks = (): NodeCallbacks => ({
  setArguments: vi.fn(),
  setAnnotations: vi.fn(),
  setCacheStaleness: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onUpgrade: vi.fn(),
  onSelect: vi.fn(),
});

const expectedIds = { taskId: "my-task", nodeId: "task_my-task" };

describe("generateDynamicNodeCallbacks", () => {
  it("returns the no-op callbacks when no node callbacks are given", () => {
    expect(generateDynamicNodeCallbacks("task_my-task")).toBe(
      DEFAULT_TASK_NODE_CALLBACKS,
    );
  });

  it("derives the task id from the node id", () => {
    const nodeCallbacks = createNodeCallbacks();

    generateDynamicNodeCallbacks("task_my-task", nodeCallbacks).onSelect();

    expect(nodeCallbacks.onSelect).toHaveBeenCalledWith(expectedIds);
  });

  it("injects the ids into callbacks that take no other arguments", () => {
    const nodeCallbacks = createNodeCallbacks();
    const callbacks = generateDynamicNodeCallbacks(
      "task_my-task",
      nodeCallbacks,
    );

    callbacks.onDelete();

    expect(nodeCallbacks.onDelete).toHaveBeenCalledWith(expectedIds);
  });

  it("injects the ids ahead of the caller's arguments", () => {
    const nodeCallbacks = createNodeCallbacks();
    const callbacks = generateDynamicNodeCallbacks(
      "task_my-task",
      nodeCallbacks,
    );
    const componentRef: ComponentReference = { url: "https://example.com" };

    callbacks.setArguments({ input1: "value1" });
    callbacks.setAnnotations({ "editor.position": "{}" });
    callbacks.setCacheStaleness("P30D");
    callbacks.onDuplicate(true);
    callbacks.onUpgrade(componentRef);

    expect(nodeCallbacks.setArguments).toHaveBeenCalledWith(expectedIds, {
      input1: "value1",
    });
    expect(nodeCallbacks.setAnnotations).toHaveBeenCalledWith(expectedIds, {
      "editor.position": "{}",
    });
    expect(nodeCallbacks.setCacheStaleness).toHaveBeenCalledWith(
      expectedIds,
      "P30D",
    );
    expect(nodeCallbacks.onDuplicate).toHaveBeenCalledWith(expectedIds, true);
    expect(nodeCallbacks.onUpgrade).toHaveBeenCalledWith(
      expectedIds,
      componentRef,
    );
  });

  it("passes an undefined trailing argument through unchanged", () => {
    const nodeCallbacks = createNodeCallbacks();

    generateDynamicNodeCallbacks("task_my-task", nodeCallbacks).onDuplicate();

    expect(nodeCallbacks.onDuplicate).toHaveBeenCalledWith(
      expectedIds,
      undefined,
    );
  });

  it("does not invoke any callback until the returned wrapper is called", () => {
    const nodeCallbacks = createNodeCallbacks();

    generateDynamicNodeCallbacks("task_my-task", nodeCallbacks);

    for (const callback of Object.values(nodeCallbacks)) {
      expect(callback).not.toHaveBeenCalled();
    }
  });
});
