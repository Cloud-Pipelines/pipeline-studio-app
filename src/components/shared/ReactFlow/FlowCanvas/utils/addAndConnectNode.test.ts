import type { Handle, Position } from "@xyflow/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { NodeManager } from "@/nodeManager";
import {
  type ComponentReference,
  type ComponentSpec,
  isGraphImplementation,
} from "@/utils/componentSpec";

import { addAndConnectNode } from "./addAndConnectNode";
import { handleConnection } from "./handleConnection";

// Mock the dependencies
vi.mock("./addTask", () => ({
  default: vi.fn((_taskType, taskSpec, _position, componentSpec) => {
    const newTaskId = `new-task-${Date.now()}`;
    return {
      ...componentSpec,
      implementation: {
        ...componentSpec.implementation,
        graph: {
          ...componentSpec.implementation.graph,
          tasks: {
            ...componentSpec.implementation.graph.tasks,
            [newTaskId]: taskSpec,
          },
        },
      },
    };
  }),
}));

vi.mock("./handleConnection", () => ({
  handleConnection: vi.fn((graph) => graph), // Just return the graph unchanged for testing
}));

describe("addAndConnectNode", () => {
  const mockNodeManager: NodeManager = {
    getHandleInfo: vi.fn(),
    getNodeId: vi.fn(),
    getHandleNodeId: vi.fn(),
  } as any;

  const mockComponentRef: ComponentReference = {
    spec: {
      name: "TestComponent",
      inputs: [{ name: "input1", type: "string" }],
      outputs: [{ name: "output1", type: "string" }],
      implementation: {
        container: { image: "test", command: ["echo"] },
      },
    },
  };

  const mockComponentSpec: ComponentSpec = {
    name: "Pipeline",
    inputs: [{ name: "pipelineInput", type: "string" }],
    outputs: [{ name: "pipelineOutput", type: "string" }],
    implementation: {
      graph: {
        tasks: {
          "existing-task": {
            annotations: {},
            componentRef: {
              spec: {
                name: "ExistingTask",
                inputs: [{ name: "taskInput", type: "string" }],
                outputs: [{ name: "taskOutput", type: "string" }],
                implementation: {
                  container: { image: "existing", command: ["run"] },
                },
              },
            },
          },
        },
      },
    },
  };

  const createMockHandle = (
    id: string | null | undefined,
    nodeId: string,
  ): Handle => ({
    id,
    nodeId,
    x: 0,
    y: 0,
    position: "top" as Position,
    type: "source",
    width: 10,
    height: 10,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return unchanged spec when implementation is not a graph", () => {
    const nonGraphSpec: ComponentSpec = {
      name: "NonGraph",
      implementation: {
        container: { image: "test", command: ["echo"] },
      },
    };

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("handle1", "node1"),
      position: { x: 100, y: 100 },
      componentSpec: nonGraphSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(nonGraphSpec);
  });

  test("should return unchanged spec when fromHandle has no id", () => {
    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle(null, "node1"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });

  test("should return unchanged spec when fromHandle has empty string id", () => {
    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("", "node1"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });

  test("should return unchanged spec when fromHandle has undefined id", () => {
    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle(undefined, "node1"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });

  test("should return unchanged spec when handle info is invalid", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue(undefined);

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("handle1", "node1"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });

  test("should return unchanged spec when handle type is invalid", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleType: "invalidType" as any,
      parentRefId: "task1",
      handleName: "output1",
    });

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("handle1", "node1"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });

  test("should add task and attempt connection from output handle", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleType: "handle-out",
      parentRefId: "existing-task",
      handleName: "taskOutput",
    });
    vi.mocked(mockNodeManager.getNodeId).mockReturnValue("new-node-id");
    vi.mocked(mockNodeManager.getHandleNodeId).mockReturnValue("new-handle-id");

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("from-handle", "from-node"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    // Should have added a new task
    const graphSpec =
      isGraphImplementation(result.implementation) &&
      result.implementation.graph;
    if (!graphSpec) {
      throw new Error("Resulting implementation is not a graph");
    }
    const tasks = graphSpec?.tasks;
    expect(Object.keys(tasks)).toHaveLength(2);

    // Verify handleConnection was called
    expect(handleConnection).toHaveBeenCalled();
  });

  test("should add task and attempt connection from input handle", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleType: "handle-in",
      parentRefId: "existing-task",
      handleName: "taskInput",
    });
    vi.mocked(mockNodeManager.getNodeId).mockReturnValue("new-node-id");
    vi.mocked(mockNodeManager.getHandleNodeId).mockReturnValue("new-handle-id");

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("from-handle", "from-node"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    // Should have added a new task
    const graphSpec =
      isGraphImplementation(result.implementation) &&
      result.implementation.graph;
    if (!graphSpec) {
      throw new Error("Resulting implementation is not a graph");
    }
    const tasks = graphSpec?.tasks;
    expect(Object.keys(tasks)).toHaveLength(2);

    // Verify handleConnection was called
    expect(handleConnection).toHaveBeenCalled();
  });

  test("should add task but skip connection when no compatible handle found", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleType: "handle-out",
      parentRefId: "existing-task",
      handleName: "taskOutput",
    });

    const incompatibleComponentRef: ComponentReference = {
      spec: {
        name: "IncompatibleComponent",
        inputs: [{ name: "input1", type: "number" }],
        outputs: [{ name: "output1", type: "boolean" }],
        implementation: {
          container: { image: "test", command: ["echo"] },
        },
      },
    };

    const result = addAndConnectNode({
      componentRef: incompatibleComponentRef,
      fromHandle: createMockHandle("from-handle", "from-node"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    // Should still add the task even without connection
    const graphSpec =
      isGraphImplementation(result.implementation) &&
      result.implementation.graph;
    if (!graphSpec) {
      throw new Error("Resulting implementation is not a graph");
    }
    const tasks = graphSpec?.tasks;
    expect(Object.keys(tasks)).toHaveLength(2);

    // Should not call handleConnection when no compatible handle
    expect(handleConnection).not.toHaveBeenCalled();
  });

  test("should handle pipeline-level input/output handles", () => {
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleType: "handle-in",
      parentRefId: "pipeline", // Pipeline-level handle
      handleName: "pipelineInput",
    });
    vi.mocked(mockNodeManager.getNodeId).mockReturnValue("new-node-id");
    vi.mocked(mockNodeManager.getHandleNodeId).mockReturnValue("new-handle-id");

    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: createMockHandle("from-handle", "from-node"),
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    // Should have added a new task
    const graphSpec =
      isGraphImplementation(result.implementation) &&
      result.implementation.graph;
    if (!graphSpec) {
      throw new Error("Resulting implementation is not a graph");
    }
    const tasks = graphSpec?.tasks;
    expect(Object.keys(tasks)).toHaveLength(2);
  });

  test("should return unchanged spec when fromHandle is null", () => {
    const result = addAndConnectNode({
      componentRef: mockComponentRef,
      fromHandle: null,
      position: { x: 100, y: 100 },
      componentSpec: mockComponentSpec,
      nodeManager: mockNodeManager,
    });

    expect(result).toBe(mockComponentSpec);
  });
});
