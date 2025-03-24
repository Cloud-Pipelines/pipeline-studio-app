import { describe, expect,it } from "vitest";

import type { ArgumentType, GraphSpec } from "../componentSpec";
import replaceTaskArgumentsInGraphSpec from "./replaceTaskArgumentsInGraphSpec";

describe("replaceTaskArgumentsInGraphSpec", () => {
  it("should update task arguments for an existing task", () => {
    const taskId = "task1";
    const initialGraphSpec: GraphSpec = {
      tasks: {
        task1: {
          componentRef: {
            name: "Test Task",
          },
          arguments: {
            arg1: "oldValue",
          },
        },
        task2: {
          componentRef: {
            name: "Another Task",
          },
          arguments: {
            arg1: "value",
          },
        },
      },
    };
    const taskArguments: Record<string, ArgumentType> = {
      arg1: "newValue",
      arg2: "newValue",
    };

    const result = replaceTaskArgumentsInGraphSpec(
      taskId,
      initialGraphSpec,
      taskArguments,
    );

    expect(result).not.toBe(initialGraphSpec);
    expect(result.tasks[taskId].arguments).toEqual(taskArguments);
    expect(result.tasks.task2).toEqual(initialGraphSpec.tasks.task2);
  });

  it("should handle undefined taskArguments by keeping existing arguments", () => {
    const taskId = "task1";
    const initialGraphSpec: GraphSpec = {
      tasks: {
        task1: {
          componentRef: {
            name: "Test Task",
          },
          arguments: {
            arg1: "value",
          },
        },
      },
    };

    const result = replaceTaskArgumentsInGraphSpec(taskId, initialGraphSpec);

    expect(result).toBe(initialGraphSpec);
    expect(result.tasks[taskId].arguments).toEqual(
      initialGraphSpec.tasks[taskId].arguments,
    );
  });

  it("should handle a task with no existing arguments", () => {
    const taskId = "task1";
    const initialGraphSpec: GraphSpec = {
      tasks: {
        task1: {
          componentRef: {
            name: "Test Task",
          },
        },
      },
    };
    const taskArguments: Record<string, ArgumentType> = {
      arg1: "newValue",
    };

    const result = replaceTaskArgumentsInGraphSpec(
      taskId,
      initialGraphSpec,
      taskArguments,
    );

    expect(result.tasks[taskId].arguments).toEqual(taskArguments);
  });

  it("should preserve other properties in the graph spec", () => {
    const taskId = "task1";
    const initialGraphSpec: GraphSpec = {
      tasks: {
        task1: {
          componentRef: {
            name: "Test Task",
          },
          arguments: {},
        },
      },
    };
    const taskArguments: Record<string, ArgumentType> = {
      arg1: "newValue",
    };

    const result = replaceTaskArgumentsInGraphSpec(
      taskId,
      initialGraphSpec,
      taskArguments,
    );

    expect(result.tasks[taskId].arguments).toEqual(taskArguments);
  });
});
