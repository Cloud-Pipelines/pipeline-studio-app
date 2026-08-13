import { describe, expect, it, vi } from "vitest";

import type { TaskNodeData } from "@/types/taskNode";

import type { TaskSpec } from "../componentSpec";
import { createTaskNode } from "./createTaskNode";

const taskSpec = (annotations?: Record<string, unknown>): TaskSpec => ({
  componentRef: {},
  ...(annotations ? { annotations } : {}),
});

const nodeData = (overrides: TaskNodeData = {}): TaskNodeData => ({
  nodeCallbacks: {
    setArguments: vi.fn(),
    setAnnotations: vi.fn(),
    setCacheStaleness: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onUpgrade: vi.fn(),
    onSelect: vi.fn(),
  },
  ...overrides,
});

describe("createTaskNode", () => {
  it("prefixes the task id to build the node id", () => {
    const node = createTaskNode(["train", taskSpec()], nodeData());

    expect(node.id).toBe("task_train");
    expect(node.data.taskId).toBe("train");
    expect(node.type).toBe("task");
  });

  it("reads the position from the editor.position annotation", () => {
    const node = createTaskNode(
      [
        "train",
        taskSpec({ "editor.position": JSON.stringify({ x: 120, y: -40 }) }),
      ],
      nodeData(),
    );

    expect(node.position).toEqual({ x: 120, y: -40 });
  });

  it("falls back to the origin when the position annotation is absent", () => {
    const node = createTaskNode(["train", taskSpec()], nodeData());

    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it("falls back to the origin when the position annotation is not valid JSON", () => {
    const node = createTaskNode(
      ["train", taskSpec({ "editor.position": "{oops" })],
      nodeData(),
    );

    expect(node.position).toEqual({ x: 0, y: 0 });
  });

  it("defaults zIndex to 0 for task nodes", () => {
    const node = createTaskNode(["train", taskSpec()], nodeData());

    expect(node.zIndex).toBe(0);
  });

  it("reads zIndex from the annotation, accepting a numeric string", () => {
    const fromNumber = createTaskNode(
      ["train", taskSpec({ zIndex: 7 })],
      nodeData(),
    );
    const fromString = createTaskNode(
      ["train", taskSpec({ zIndex: "7" })],
      nodeData(),
    );

    expect(fromNumber.zIndex).toBe(7);
    expect(fromString.zIndex).toBe(7);
  });

  it("rounds a fractional zIndex annotation", () => {
    const node = createTaskNode(
      ["train", taskSpec({ zIndex: 3.6 })],
      nodeData(),
    );

    expect(node.zIndex).toBe(4);
  });

  it("ignores a non-numeric zIndex annotation", () => {
    const node = createTaskNode(
      ["train", taskSpec({ zIndex: "front" })],
      nodeData(),
    );

    expect(node.zIndex).toBe(0);
  });

  it("attaches the task spec unchanged and starts unhighlighted", () => {
    const spec = taskSpec({ zIndex: 2 });

    const node = createTaskNode(["train", spec], nodeData());

    expect(node.data.taskSpec).toBe(spec);
    expect(node.data.highlighted).toBe(false);
  });

  it("wraps every node callback under data.callbacks", () => {
    const node = createTaskNode(["train", taskSpec()], nodeData());

    expect(node.data.callbacks).toEqual({
      setArguments: expect.any(Function),
      setAnnotations: expect.any(Function),
      setCacheStaleness: expect.any(Function),
      onDelete: expect.any(Function),
      onDuplicate: expect.any(Function),
      onUpgrade: expect.any(Function),
      onSelect: expect.any(Function),
    });
  });

  it("produces empty callbacks when no node callbacks are supplied", () => {
    const node = createTaskNode(["train", taskSpec()], {});

    expect(node.data.callbacks).toEqual({});
  });

  it("defaults readOnly to false and lets the argument override nodeData", () => {
    const implicit = createTaskNode(["train", taskSpec()], nodeData());
    const explicit = createTaskNode(["train", taskSpec()], nodeData(), true);
    const overridden = createTaskNode(
      ["train", taskSpec()],
      nodeData({ readOnly: true }),
    );

    expect(implicit.data.readOnly).toBe(false);
    expect(explicit.data.readOnly).toBe(true);
    // The readOnly argument is spread last, so it wins over nodeData.readOnly.
    expect(overridden.data.readOnly).toBe(false);
  });
});
