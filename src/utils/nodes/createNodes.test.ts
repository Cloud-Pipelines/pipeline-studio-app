import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentSpec } from "../componentSpec";
import { isGraphImplementation } from "../componentSpec";
import createNodes from "./createNodes";

describe("createNodes", () => {
  const createBasicComponentSpec = (implementation: any): ComponentSpec => ({
    name: "Test Component",
    implementation,
    inputs: [],
    outputs: [],
  });

  const mockNodeCallbacks = {
    onDelete: vi.fn(),
    setArguments: vi.fn(),
  };

  beforeEach(() => {
    mockNodeCallbacks.setArguments.mockClear();
  });

  it("returns empty array for non-graph implementations", () => {
    const componentSpec = createBasicComponentSpec({
      container: { image: "test" },
    });

    const result = createNodes(componentSpec, mockNodeCallbacks);

    expect(result).toEqual([]);
  });

  it("creates task nodes correctly", () => {
    const componentSpec = createBasicComponentSpec({
      graph: {
        tasks: {
          task1: {
            componentRef: {},
            annotations: {
              "editor.position": JSON.stringify({ x: 100, y: 200 }),
            },
          },
        },
        outputValues: {},
      },
    });

    if (!isGraphImplementation(componentSpec.implementation)) {
      throw new Error("Expected graph implementation");
    }

    const result = createNodes(componentSpec, mockNodeCallbacks);

    expect(result).toContainEqual(
      expect.objectContaining({
        id: "task_task1",
        position: { x: 100, y: 200 },
        type: "task",
        data: expect.objectContaining({
          taskId: "task1",
          taskSpec: componentSpec.implementation.graph.tasks.task1,
        }),
      }),
    );
  });

  it("creates input nodes correctly", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      implementation: { graph: { tasks: {}, outputValues: {} } },
      inputs: [
        {
          name: "input1",
          annotations: { "editor.position": JSON.stringify({ x: 50, y: 100 }) },
        },
      ],
      outputs: [],
    };

    const result = createNodes(componentSpec, mockNodeCallbacks);

    expect(result).toContainEqual({
      id: "input_input1",
      data: { label: "input1" },
      position: { x: 50, y: 100 },
      type: "input",
    });
  });

  it("creates output nodes correctly", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      implementation: { graph: { tasks: {}, outputValues: {} } },
      inputs: [],
      outputs: [
        {
          name: "output1",
          annotations: {
            "editor.position": JSON.stringify({ x: 300, y: 150 }),
          },
        },
      ],
    };

    const result = createNodes(componentSpec, mockNodeCallbacks);

    expect(result).toContainEqual({
      id: "output_output1",
      data: { label: "output1" },
      position: { x: 300, y: 150 },
      type: "output",
    });
  });

  it("handles missing position annotations by using default position", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      implementation: {
        graph: {
          tasks: {
            task1: {
              componentRef: {},
            },
          },
          outputValues: {},
        },
      },
      inputs: [{ name: "input1" }],
      outputs: [{ name: "output1" }],
    };

    const result = createNodes(componentSpec, mockNodeCallbacks);
    const defaultPosition = { x: 0, y: 0 };

    expect(result).toContainEqual(
      expect.objectContaining({
        id: "task_task1",
        position: defaultPosition,
      }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: "input_input1",
        position: defaultPosition,
      }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: "output_output1",
        position: defaultPosition,
      }),
    );
  });

  it("tests the setArguments function in task nodes", () => {
    const taskId = "task1";
    const nodeId = `task_${taskId}`;

    const mockSetArguments = mockNodeCallbacks.setArguments;

    const componentSpec = createBasicComponentSpec({
      graph: {
        tasks: {
          [taskId]: {
            componentRef: {},
            arguments: { existingArg: "value" },
          },
        },
        outputValues: {},
      },
    });

    const result = createNodes(componentSpec, mockNodeCallbacks);
    const taskNode = result.find((node) => node.id === nodeId) as
      | { id: string; data: { setArguments: (args: any) => void } }
      | undefined;

    const newArgs = { newArg: "newValue" };
    taskNode?.data.setArguments(newArgs);

    expect(mockSetArguments).toHaveBeenCalledTimes(1);
    expect(mockSetArguments).toHaveBeenCalledWith({ taskId, nodeId }, newArgs);
  });
});
