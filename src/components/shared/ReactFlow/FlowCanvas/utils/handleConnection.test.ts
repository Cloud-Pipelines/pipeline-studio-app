import type { Connection } from "@xyflow/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { NodeManager } from "@/nodeManager";
import type { GraphSpec } from "@/utils/componentSpec";

import { handleConnection } from "./handleConnection";
import { setGraphOutputValue } from "./setGraphOutputValue";
import { setTaskArgument } from "./setTaskArgument";

vi.mock("./setGraphOutputValue", () => ({
  setGraphOutputValue: vi.fn((graphSpec, outputName, argument) => ({
    ...graphSpec,
    outputValues: {
      ...graphSpec.outputValues,
      [outputName]: argument,
    },
  })),
}));

vi.mock("./setTaskArgument", () => ({
  setTaskArgument: vi.fn((graphSpec, taskId, inputName, argument) => ({
    ...graphSpec,
    tasks: {
      ...graphSpec.tasks,
      [taskId]: {
        ...graphSpec.tasks[taskId],
        arguments: {
          ...graphSpec.tasks[taskId]?.arguments,
          [inputName]: argument,
        },
      },
    },
  })),
}));

describe("handleConnection", () => {
  const mockNodeManager: NodeManager = {
    getRefId: vi.fn(),
    getNodeType: vi.fn(),
    getHandleInfo: vi.fn(),
  } as any;

  const mockGraphSpec: GraphSpec = {
    tasks: {
      "task-1": {
        componentRef: {
          spec: {
            name: "Task1",
            implementation: { container: { image: "test" } },
          },
        },
        arguments: {},
      },
      "task-2": {
        componentRef: {
          spec: {
            name: "Task2",
            implementation: { container: { image: "test" } },
          },
        },
        arguments: {},
      },
    },
    outputValues: {},
  };

  const createConnection = (
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string,
  ): Connection => ({
    source,
    sourceHandle,
    target,
    targetHandle,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return unchanged graph when source ID cannot be resolved", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? undefined : "target-task",
    );
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
  });

  test("should return unchanged graph when target ID cannot be resolved", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "source-task" : undefined,
    );
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
  });

  test("should return unchanged graph when source type cannot be resolved", () => {
    vi.mocked(mockNodeManager.getRefId).mockReturnValue("valid-id");
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? undefined : "task",
    );

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
  });

  test("should return unchanged graph when target type cannot be resolved", () => {
    vi.mocked(mockNodeManager.getRefId).mockReturnValue("valid-id");
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task" : undefined,
    );

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
  });

  test("should return unchanged graph when source and target are the same", () => {
    vi.mocked(mockNodeManager.getRefId).mockReturnValue("same-task");
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
  });

  test("should handle graph input to task connection", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "input-myInput" : "task-1",
    );
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "input" : "task",
    );
    vi.mocked(mockNodeManager.getHandleInfo).mockImplementation((handleId) =>
      handleId === "target-handle"
        ? {
            handleName: "taskInput",
            handleType: "handle_in",
            parentRefId: "task-1",
          }
        : undefined,
    );

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    const expectedInputName = "input-myInput";
    expect(result.tasks["task-1"].arguments).toEqual({
      taskInput: {
        graphInput: { inputName: expectedInputName },
      },
    });

    expect(setTaskArgument).toHaveBeenCalledWith(
      mockGraphSpec,
      "task-1",
      "taskInput",
      { graphInput: { inputName: expectedInputName } },
    );
  });

  test("should return unchanged graph when target handle name is missing for input to task", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "input-myInput" : "task-1",
    );
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "input" : "task",
    );
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleName: "",
      handleType: "handle_in",
      parentRefId: "task-1",
    });

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
    expect(setTaskArgument).not.toHaveBeenCalled();
  });

  test("should handle task to task connection", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task-1" : "task-2",
    );
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");
    vi.mocked(mockNodeManager.getHandleInfo).mockImplementation((handleId) => {
      if (handleId === "source-handle") {
        return {
          handleName: "output1",
          handleType: "handle_out",
          parentRefId: "task-1",
        };
      }
      if (handleId === "target-handle") {
        return {
          handleName: "input1",
          handleType: "handle_in",
          parentRefId: "task-2",
        };
      }
      return undefined;
    });

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result.tasks["task-2"].arguments).toEqual({
      input1: {
        taskOutput: {
          taskId: "task-1",
          outputName: "output1",
        },
      },
    });

    expect(setTaskArgument).toHaveBeenCalledWith(
      mockGraphSpec,
      "task-2",
      "input1",
      { taskOutput: { taskId: "task-1", outputName: "output1" } },
    );
  });

  test("should return unchanged graph when source handle name is missing for task to task", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task-1" : "task-2",
    );
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");
    vi.mocked(mockNodeManager.getHandleInfo).mockImplementation((handleId) => {
      if (handleId === "source-handle") {
        return {
          handleName: "",
          handleType: "handle_out",
          parentRefId: "task-1",
        };
      }
      if (handleId === "target-handle") {
        return {
          handleName: "input1",
          handleType: "handle_in",
          parentRefId: "task-2",
        };
      }
      return undefined;
    });

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
    expect(setTaskArgument).not.toHaveBeenCalled();
  });

  test("should return unchanged graph when target handle name is missing for task to task", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task-1" : "task-2",
    );
    vi.mocked(mockNodeManager.getNodeType).mockReturnValue("task");
    vi.mocked(mockNodeManager.getHandleInfo).mockImplementation((handleId) => {
      if (handleId === "source-handle") {
        return {
          handleName: "output1",
          handleType: "handle_out",
          parentRefId: "task-1",
        };
      }
      if (handleId === "target-handle") {
        return {
          handleName: "",
          handleType: "handle_in",
          parentRefId: "task-2",
        };
      }
      return undefined;
    });

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
    expect(setTaskArgument).not.toHaveBeenCalled();
  });

  test("should handle task to graph output connection", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task-1" : "output-myOutput",
    );
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task" : "output",
    );
    vi.mocked(mockNodeManager.getHandleInfo).mockImplementation((handleId) =>
      handleId === "source-handle"
        ? {
            handleName: "taskOutput",
            handleType: "handle_out",
            parentRefId: "task-1",
          }
        : undefined,
    );

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    const expectedOutputName = "output-myOutput";
    expect(result.outputValues).toEqual({
      [expectedOutputName]: {
        taskOutput: {
          taskId: "task-1",
          outputName: "taskOutput",
        },
      },
    });

    expect(setGraphOutputValue).toHaveBeenCalledWith(
      mockGraphSpec,
      expectedOutputName,
      { taskOutput: { taskId: "task-1", outputName: "taskOutput" } },
    );
  });

  test("should return unchanged graph when source handle name is missing for task to output", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task-1" : "output-myOutput",
    );
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "task" : "output",
    );
    vi.mocked(mockNodeManager.getHandleInfo).mockReturnValue({
      handleName: "", // Empty handle name
      handleType: "handle_out",
      parentRefId: "task-1",
    });

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
    expect(setGraphOutputValue).not.toHaveBeenCalled();
  });

  test("should return unchanged graph for unsupported connection types", () => {
    vi.mocked(mockNodeManager.getRefId).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "output-1" : "input-1",
    );
    vi.mocked(mockNodeManager.getNodeType).mockImplementation((nodeId) =>
      nodeId === "source-node" ? "output" : "input",
    );

    const connection = createConnection(
      "source-node",
      "source-handle",
      "target-node",
      "target-handle",
    );

    const result = handleConnection(mockGraphSpec, connection, mockNodeManager);

    expect(result).toBe(mockGraphSpec);
    expect(setTaskArgument).not.toHaveBeenCalled();
    expect(setGraphOutputValue).not.toHaveBeenCalled();
  });
});
