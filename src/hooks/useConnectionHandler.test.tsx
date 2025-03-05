import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useConnectionHandler } from "./useConnectionHandler";
import type { Connection } from "@xyflow/react";

describe("useConnectionHandler", () => {
  const mockSetTaskArgument = vi.fn();
  const mockSetGraphOutputValue = vi.fn();

  beforeEach(() => {
    mockSetTaskArgument.mockClear();
    mockSetGraphOutputValue.mockClear();
  });

  it("should handle task output to task input connections", () => {
    const { result } = renderHook(() =>
      useConnectionHandler({
        setTaskArgument: mockSetTaskArgument,
        setGraphOutputValue: mockSetGraphOutputValue,
      }),
    );

    const connection: Connection = {
      source: "task_123",
      sourceHandle: "output_result",
      target: "task_456",
      targetHandle: "input_data",
    };

    result.current(connection);

    expect(mockSetTaskArgument).toHaveBeenCalledWith("456", "data", {
      taskOutput: {
        taskId: "123",
        outputName: "result",
      },
    });
    expect(mockSetGraphOutputValue).not.toHaveBeenCalled();
  });

  it("should handle task output to graph output connections", () => {
    const { result } = renderHook(() =>
      useConnectionHandler({
        setTaskArgument: mockSetTaskArgument,
        setGraphOutputValue: mockSetGraphOutputValue,
      }),
    );

    const connection: Connection = {
      source: "task_123",
      sourceHandle: "output_result",
      target: "output_finalResult",
      targetHandle: null,
    };

    result.current(connection);

    expect(mockSetGraphOutputValue).toHaveBeenCalledWith("finalResult", {
      taskOutput: {
        taskId: "123",
        outputName: "result",
      },
    });
    expect(mockSetTaskArgument).not.toHaveBeenCalled();
  });

  it("should handle graph input to task input connections", () => {
    const { result } = renderHook(() =>
      useConnectionHandler({
        setTaskArgument: mockSetTaskArgument,
        setGraphOutputValue: mockSetGraphOutputValue,
      }),
    );

    const connection: Connection = {
      source: "input_initialData",
      sourceHandle: null,
      target: "task_456",
      targetHandle: "input_data",
    };

    result.current(connection);

    expect(mockSetTaskArgument).toHaveBeenCalledWith("456", "data", {
      graphInput: {
        inputName: "initialData",
      },
    });
    expect(mockSetGraphOutputValue).not.toHaveBeenCalled();
  });

  it("should log error when trying to connect graph input to graph output", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useConnectionHandler({
        setTaskArgument: mockSetTaskArgument,
        setGraphOutputValue: mockSetGraphOutputValue,
      }),
    );

    const connection: Connection = {
      source: "input_initialData",
      sourceHandle: null,
      target: "output_finalResult",
      targetHandle: null,
    };

    result.current(connection);

    expect(consoleSpy).toHaveBeenCalled();
    expect(mockSetTaskArgument).not.toHaveBeenCalled();
    expect(mockSetGraphOutputValue).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
