import { MarkerType } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";

import type { NodeManager } from "@/nodeManager";

import type { ComponentSpec } from "../utils/componentSpec";
import { getEdges } from "./useComponentSpecToEdges";

describe("getEdges", () => {
  const mockNodeManager: NodeManager = {
    getNodeId: vi.fn((refId: string, type: string) => `${type}_${refId}`),
    getHandleNodeId: vi.fn(
      (_refId: string, handleName: string) => `${handleName}`,
    ),
  } as any;

  const createBasicComponentSpec = (implementation: any): ComponentSpec => ({
    name: "Test Component",
    implementation,
    inputs: [],
    outputs: [],
  });

  it("returns empty array for non-graph implementations", () => {
    const componentSpec = createBasicComponentSpec({
      container: { image: "test" },
    });

    const result = getEdges(componentSpec, mockNodeManager);

    expect(result).toEqual([]);
  });

  it("creates task edges correctly", () => {
    const componentSpec = createBasicComponentSpec({
      graph: {
        tasks: {
          task1: {
            componentRef: {},
            arguments: {
              input1: {
                taskOutput: { taskId: "task2", outputName: "output1" },
              },
            },
          },
        },
        outputValues: {},
      },
    });

    const result = getEdges(componentSpec, mockNodeManager);

    expect(result).toContainEqual({
      id: "task2_output1-task1_input1",
      source: "task_task2",
      sourceHandle: "output1",
      target: "task_task1",
      targetHandle: "input1",
      markerEnd: { type: MarkerType.Arrow },
      type: "customEdge",
    });
  });

  it("creates graph input edges correctly", () => {
    const componentSpec = createBasicComponentSpec({
      graph: {
        tasks: {
          task1: {
            componentRef: {},
            arguments: {
              input1: { graphInput: { inputName: "graphInput1" } },
            },
          },
        },
        outputValues: {},
      },
    });

    const result = getEdges(componentSpec, mockNodeManager);

    expect(result).toContainEqual({
      id: "Input_graphInput1-task1_input1",
      source: "input_graphInput1",
      sourceHandle: null,
      target: "task_task1",
      targetHandle: "input1",
      markerEnd: { type: MarkerType.Arrow },
      type: "customEdge",
    });
  });

  it("creates output edges correctly", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      implementation: {
        graph: {
          tasks: {},
          outputValues: {
            graphOutput1: {
              taskOutput: { taskId: "task1", outputName: "output1" },
            },
          },
        },
      },
      inputs: [],
      outputs: [],
    };

    const result = getEdges(componentSpec, mockNodeManager);

    expect(result).toContainEqual({
      id: "task1_output1-Output_graphOutput1",
      source: "task_task1",
      sourceHandle: "output1",
      target: "output_graphOutput1",
      targetHandle: null,
      markerEnd: { type: MarkerType.Arrow },
      type: "customEdge",
    });
  });
});
