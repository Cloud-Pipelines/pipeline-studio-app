import type { Node } from "@xyflow/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { NodeManager } from "@/nodeManager";
import {
  type ComponentSpec,
  isGraphImplementation,
} from "@/utils/componentSpec";

import { updateNodePositions } from "./updateNodePosition";

describe("updateNodePositions", () => {
  const mockNodeManager = {
    getRefId: vi.fn(),
  } as unknown as NodeManager;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId: string) => {
      if (nodeId === "task_123") return "123";
      if (nodeId === "input_test_input") return "test_input";
      if (nodeId === "output_test_output") return "test_output";
      return undefined;
    });
  });

  test("should throw an error if implementation is not graph", () => {
    const nodes: Node[] = [];
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        container: {
          image: "test",
        },
      },
      inputs: [],
      outputs: [],
    };

    expect(() =>
      updateNodePositions(nodes, componentSpec, mockNodeManager),
    ).toThrow("Component spec is not a graph");
  });

  test("should update task node positions", () => {
    const nodes: Node[] = [
      {
        id: "task_123",
        type: "task",
        position: { x: 100, y: 200 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {
            "123": {
              componentRef: {},
              annotations: {},
            },
          },
        },
      },
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);
    const graph = isGraphImplementation(result.implementation)
      ? result.implementation.graph
      : null;
    expect(graph).not.toBeNull();
    if (!graph) return;

    expect(graph.tasks["123"].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 100, y: 200 }),
    });
  });

  test("should update input node positions", () => {
    const nodes: Node[] = [
      {
        id: "input_test_input",
        type: "input",
        position: { x: 50, y: 100 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: { graph: { tasks: {} } },
      inputs: [
        {
          name: "test_input",
          type: "string",
          annotations: {},
        },
      ],
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);

    expect(result.inputs![0].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 50, y: 100 }),
    });
  });

  test("should update output node positions", () => {
    const nodes: Node[] = [
      {
        id: "output_test_output",
        type: "output",
        position: { x: 300, y: 150 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: { graph: { tasks: {} } },
      outputs: [
        {
          name: "test_output",
          type: "string",
          annotations: {},
        },
      ],
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);

    expect(result.outputs![0].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 300, y: 150 }),
    });
  });

  test("should handle multiple node types simultaneously", () => {
    const nodes: Node[] = [
      {
        id: "task_123",
        type: "task",
        position: { x: 100, y: 200 },
        data: {},
      },
      {
        id: "input_test_input",
        type: "input",
        position: { x: 50, y: 100 },
        data: {},
      },
      {
        id: "output_test_output",
        type: "output",
        position: { x: 300, y: 150 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {
            "123": {
              componentRef: {},
              annotations: {},
            },
          },
        },
      },
      inputs: [
        {
          name: "test_input",
          type: "string",
          annotations: {},
        },
      ],
      outputs: [
        {
          name: "test_output",
          type: "string",
          annotations: {},
        },
      ],
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);
    const graph = isGraphImplementation(result.implementation)
      ? result.implementation.graph
      : null;
    expect(graph).not.toBeNull();
    if (!graph) return;

    expect(graph.tasks["123"].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 100, y: 200 }),
    });

    expect(result.inputs![0].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 50, y: 100 }),
    });

    expect(result.outputs![0].annotations).toEqual({
      "editor.position": JSON.stringify({ x: 300, y: 150 }),
    });
  });

  test("should preserve existing annotations", () => {
    const nodes: Node[] = [
      {
        id: "task_123",
        type: "task",
        position: { x: 100, y: 200 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {
            "123": {
              componentRef: {},
              annotations: {
                "existing.annotation": "value",
              },
            },
          },
        },
      },
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);

    const graph = isGraphImplementation(result.implementation)
      ? result.implementation.graph
      : null;
    expect(graph).not.toBeNull();
    if (!graph) return;

    expect(graph.tasks["123"].annotations).toEqual({
      "existing.annotation": "value",
      "editor.position": JSON.stringify({ x: 100, y: 200 }),
    });
  });

  test("should skip nodes with no ref ID", () => {
    vi.mocked(mockNodeManager.getRefId).mockReturnValue(undefined);

    const nodes: Node[] = [
      {
        id: "unknown_node",
        type: "task",
        position: { x: 100, y: 200 },
        data: {},
      },
    ];

    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {},
        },
      },
    };

    const result = updateNodePositions(nodes, componentSpec, mockNodeManager);

    expect(result).toEqual(componentSpec);
  });
});
