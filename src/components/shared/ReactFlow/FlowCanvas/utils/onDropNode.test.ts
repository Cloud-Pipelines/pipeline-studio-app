import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentSpec, TaskSpec } from "@/utils/componentSpec";

import onDropNode from "./onDropNode";

describe("onDropNode", () => {
  let mockEvent: any;
  let mockReactFlowInstance: any;
  let mockComponentSpec: ComponentSpec;

  beforeEach(() => {
    mockEvent = {
      clientX: 100,
      clientY: 200,
      dataTransfer: {
        getData: vi.fn(),
      },
    };

    mockReactFlowInstance = {
      screenToFlowPosition: vi.fn().mockReturnValue({ x: 50, y: 100 }),
    };

    mockComponentSpec = {
      name: "TestComponent",
      inputs: [],
      outputs: [],
      implementation: { graph: { tasks: {} } },
    };
  });

  it("should do nothing if dropped data is empty", () => {
    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow") return "";
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      mockComponentSpec,
    );

    expect(JSON.stringify(result)).toBe(JSON.stringify(mockComponentSpec));
  });

  it("should add a task node when task type is dropped", () => {
    const mockTaskSpec: TaskSpec = {
      componentRef: {
        spec: {
          name: "TestTask",
          implementation: { graph: { tasks: {} } },
        },
      },
      annotations: {},
    };

    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ task: mockTaskSpec });
      if (type === "DragStart.offset")
        return JSON.stringify({ offsetX: 10, offsetY: 20 });
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      mockComponentSpec,
    );

    const newComponentSpec = result as typeof mockComponentSpec & {
      implementation: { graph: { tasks: Record<string, any> } };
    };

    expect(
      Object.keys(newComponentSpec.implementation.graph.tasks).length,
    ).toBe(1);

    const taskId = Object.keys(newComponentSpec.implementation.graph.tasks)[0];
    const task = newComponentSpec.implementation.graph.tasks[taskId];
    expect(task.annotations).toHaveProperty("editor.position");
    expect(task.annotations["editor.position"]).toBe(
      JSON.stringify({ x: 50, y: 100 }),
    );
  });

  it("should add an input node when input type is dropped", () => {
    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ input: {} });
      if (type === "DragStart.offset")
        return JSON.stringify({ offsetX: 10, offsetY: 20 });
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      mockComponentSpec,
    );

    const newComponentSpec = result as typeof mockComponentSpec & {
      inputs: Array<{ name: string; annotations: Record<string, any> }>;
    };

    expect(newComponentSpec.inputs.length).toBe(1);
    expect(newComponentSpec.inputs[0].name).toBe("Input");
    expect(newComponentSpec.inputs[0].annotations).toHaveProperty(
      "editor.position",
    );
  });

  it("should add an output node when output type is dropped", () => {
    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ output: {} });
      if (type === "DragStart.offset")
        return JSON.stringify({ offsetX: 10, offsetY: 20 });
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      mockComponentSpec,
    );

    const newComponentSpec = result as typeof mockComponentSpec & {
      outputs: Array<{ name: string; annotations: Record<string, any> }>;
    };

    expect(newComponentSpec.outputs.length).toBe(1);
    expect(newComponentSpec.outputs[0].name).toBe("Output");
    expect(newComponentSpec.outputs[0].annotations).toHaveProperty(
      "editor.position",
    );
  });

  it("should create unique names for tasks when duplicates exist", () => {
    const mockGraphSpec = {
      tasks: {
        TestTask: { componentRef: {}, annotations: {} },
      },
    };

    const mockTaskSpec: TaskSpec = {
      componentRef: {
        spec: {
          name: "TestTask",
          implementation: { graph: { tasks: {} } },
        },
      },
      annotations: {},
    };

    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ task: mockTaskSpec });
      return "";
    });

    const result = onDropNode(mockEvent as any, mockReactFlowInstance, {
      ...mockComponentSpec,
      implementation: { graph: mockGraphSpec },
    });

    const newComponentSpec = result;

    const taskIds =
      "graph" in newComponentSpec.implementation &&
      newComponentSpec.implementation.graph.tasks
        ? Object.keys(newComponentSpec.implementation.graph.tasks)
        : [];
    expect(taskIds.length).toBe(2);
    expect(taskIds).toContain("TestTask 2");
  });

  it("should create unique names for inputs when duplicates exist", () => {
    mockComponentSpec = {
      ...mockComponentSpec,
      inputs: [{ name: "Input", annotations: {} }],
    };

    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ input: {} });
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      mockComponentSpec,
    );

    const newComponentSpec = result as typeof mockComponentSpec & {
      inputs: Array<{ name: string; annotations: Record<string, any> }>;
    };

    expect(newComponentSpec.inputs.length).toBe(2);
    expect(newComponentSpec.inputs[1].name).toBe("Input 2");
  });

  it("should create unique names for outputs when duplicates exist", () => {
    const newMockComponentSpec = {
      ...mockComponentSpec,
      outputs: [{ name: "Output", annotations: {} }],
    };

    mockEvent.dataTransfer.getData.mockImplementation((type: string) => {
      if (type === "application/reactflow")
        return JSON.stringify({ output: {} });
      return "";
    });

    const result = onDropNode(
      mockEvent as any,
      mockReactFlowInstance,
      newMockComponentSpec,
    );

    const newComponentSpec = result as typeof newMockComponentSpec & {
      outputs: Array<{ name: string; annotations: Record<string, any> }>;
    };

    expect(newComponentSpec.outputs.length).toBe(2);
    expect(newComponentSpec.outputs[1].name).toBe("Output 2");
  });
});
