import type { Node } from "@xyflow/react";
import { describe, expect, test } from "vitest";

import type { ComponentSpec } from "@/utils/componentSpec";

import { updateNodePositions } from "./updateNodePosition";

describe("updateNodePositions", () => {
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

    expect(() => updateNodePositions(nodes, componentSpec)).toThrow(
      "Component spec is not a graph",
    );
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

    const result = updateNodePositions(nodes, componentSpec);

    expect(result).toMatchObject({
      implementation: {
        graph: {
          tasks: {
            "123": {
              componentRef: {},
              annotations: {
                "editor.position": JSON.stringify({ x: 100, y: 200 }),
              },
            },
          },
        },
      },
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

    const result = updateNodePositions(nodes, componentSpec);

    expect(result).toMatchObject({
      inputs: [
        {
          name: "test_input",
          type: "string",
          annotations: {
            "editor.position": JSON.stringify({ x: 50, y: 100 }),
          },
        },
      ],
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

    const result = updateNodePositions(nodes, componentSpec);

    expect(result).toMatchObject({
      outputs: [
        {
          name: "test_output",
          type: "string",
          annotations: {
            "editor.position": JSON.stringify({ x: 300, y: 150 }),
          },
        },
      ],
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

    const result = updateNodePositions(nodes, componentSpec);

    expect(result).toMatchObject({
      implementation: {
        graph: {
          tasks: {
            "123": expect.objectContaining({
              componentRef: {},
              annotations: {
                "editor.position": JSON.stringify({ x: 100, y: 200 }),
              },
            }),
          },
        },
      },
      inputs: [
        expect.objectContaining({
          annotations: {
            "editor.position": JSON.stringify({ x: 50, y: 100 }),
          },
        }),
      ],
      outputs: [
        expect.objectContaining({
          annotations: {
            "editor.position": JSON.stringify({ x: 300, y: 150 }),
          },
        }),
      ],
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

    const result = updateNodePositions(nodes, componentSpec);

    expect(result).toMatchObject({
      implementation: {
        graph: {
          tasks: {
            "123": {
              componentRef: {},
              annotations: {
                "existing.annotation": "value",
                "editor.position": JSON.stringify({ x: 100, y: 200 }),
              },
            },
          },
        },
      },
    });
  });
});
