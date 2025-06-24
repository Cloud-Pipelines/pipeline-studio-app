import { describe, expect, it } from "vitest";

import type { GraphSpec, TaskOutputArgument } from "@/utils/componentSpec";

import { setGraphOutputValue } from "./setGraphOutputValue";

describe("setGraphOutputValue", () => {
  const mockGraphSpec: GraphSpec = {
    tasks: {},
    outputValues: {
      existingOutput: {
        taskOutput: {
          taskId: "task1",
          outputName: "output1",
        },
      },
    },
  };

  it("should set a new output value", () => {
    const newOutputValue: TaskOutputArgument = {
      taskOutput: {
        taskId: "task2",
        outputName: "output2",
      },
    };

    const result = setGraphOutputValue(
      mockGraphSpec,
      "newOutput",
      newOutputValue,
    );

    expect(result.outputValues).toEqual({
      existingOutput: {
        taskOutput: {
          taskId: "task1",
          outputName: "output1",
        },
      },
      newOutput: newOutputValue,
    });
  });

  it("should update an existing output value", () => {
    const updatedOutputValue: TaskOutputArgument = {
      taskOutput: {
        taskId: "task3",
        outputName: "output3",
      },
    };

    const result = setGraphOutputValue(
      mockGraphSpec,
      "existingOutput",
      updatedOutputValue,
    );

    expect(result.outputValues).toEqual({
      existingOutput: updatedOutputValue,
    });
  });

  it("should remove an output value when outputValue is undefined", () => {
    const result = setGraphOutputValue(
      mockGraphSpec,
      "existingOutput",
      undefined,
    );

    expect(result.outputValues).toEqual({});
  });

  it("should handle removing a non-existent output value", () => {
    const result = setGraphOutputValue(
      mockGraphSpec,
      "nonExistentOutput",
      undefined,
    );

    expect(result.outputValues).toEqual({
      existingOutput: {
        taskOutput: {
          taskId: "task1",
          outputName: "output1",
        },
      },
    });
  });

  it("should handle empty outputValues", () => {
    const emptyGraphSpec: GraphSpec = {
      tasks: {},
      outputValues: {},
    };

    const result = setGraphOutputValue(emptyGraphSpec, "someOutput", undefined);

    expect(result.outputValues).toEqual({});
  });

  it("should handle undefined outputValues", () => {
    const undefinedGraphSpec: GraphSpec = {
      tasks: {},
      outputValues: undefined,
    };

    const result = setGraphOutputValue(
      undefinedGraphSpec,
      "someOutput",
      undefined,
    );

    expect(result.outputValues).toEqual({});
  });
});
