import { describe, expect, it } from "vitest";

import {
  type ComponentSpec,
  generateArgumentsFromInputs,
  isGraphImplementation,
  renameInput,
  renameOutput,
} from "./componentSpec";

describe("generateArgumentsFromInputs", () => {
  it("should generate arguments from inputs with values", () => {
    const componentSpec: ComponentSpec = {
      name: "Scheduled pipeline 1 (2025-06-23T14:00:39.046Z)",
      metadata: {
        annotations: {
          sdk: "https://cloud-pipelines.net/pipeline-editor/",
          "editor.flow-direction": "left-to-right",
        },
      },
      inputs: [
        {
          name: "Time",
          type: "DateTime",
          value: "2025-06-23T14:00:39.046Z", // Added value property
          annotations: {
            "editor.position": '{"x":-20,"y":190,"width":150,"height":40}',
          },
        },
      ],
      outputs: [
        {
          name: "Result",
          annotations: {
            "editor.position": '{"x":510,"y":240,"width":150,"height":40}',
          },
        },
      ],
      implementation: {
        graph: {
          tasks: {
            task_1: {
              componentRef: {
                spec: {
                  name: "Pass-through",
                  inputs: [
                    {
                      name: "Input1",
                    },
                  ],
                  outputs: [
                    {
                      name: "Output1",
                    },
                  ],
                  implementation: {
                    container: {
                      image: "alpine",
                      command: [
                        "sh",
                        "-c",
                        'echo "$0" >"$1"\n',
                        {
                          inputValue: "Input1",
                        },
                        {
                          outputPath: "Output1",
                        },
                      ],
                    },
                  },
                },
              },
              arguments: {
                Input1: {
                  graphInput: {
                    inputName: "Time",
                  },
                },
              },
              annotations: {
                "editor.position": '{"x":180,"y":160,"width":180,"height":157}',
              },
            },
          },
          outputValues: {
            Result: {
              taskOutput: {
                outputName: "Output1",
                taskId: "task_1",
              },
            },
          },
        },
      },
    };

    const result = generateArgumentsFromInputs(componentSpec);

    expect(result).toEqual({
      Time: "2025-06-23T14:00:39.046Z",
    });
  });

  it("should return empty object when no inputs have values", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [
        {
          name: "Input1",
          type: "String",
        },
        {
          name: "Input2",
          type: "Integer",
        },
      ],
      implementation: {
        graph: {
          tasks: {},
        },
      },
    };

    const result = generateArgumentsFromInputs(componentSpec);

    expect(result).toEqual({});
  });

  it("should return empty object when component has no inputs", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      implementation: {
        graph: {
          tasks: {},
        },
      },
    };

    const result = generateArgumentsFromInputs(componentSpec);

    expect(result).toEqual({});
  });

  it("should handle multiple inputs with values", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [
        {
          name: "Time",
          type: "DateTime",
          value: "2025-06-23T14:00:39.046Z",
        },
        {
          name: "Name",
          type: "String",
          value: "Test Pipeline",
        },
        {
          name: "Count",
          type: "Integer",
          value: "42",
        },
        {
          name: "OptionalInput",
          type: "String",
          // No value property
        },
      ],
      implementation: {
        graph: {
          tasks: {},
        },
      },
    };

    const result = generateArgumentsFromInputs(componentSpec);

    expect(result).toEqual({
      Time: "2025-06-23T14:00:39.046Z",
      Name: "Test Pipeline",
      Count: "42",
    });
  });
});

describe("renameInput", () => {
  it("should rename an input and update all graph spec references", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [
        { name: "oldInput", type: "String" },
        { name: "otherInput", type: "Integer" },
      ],
      outputs: [],
      implementation: {
        graph: {
          tasks: {
            task1: {
              componentRef: {
                spec: {
                  name: "Task1",
                  inputs: [{ name: "input1" }],
                  outputs: [],
                  implementation: { graph: { tasks: {} } },
                },
              },
              arguments: {
                input1: {
                  graphInput: {
                    inputName: "oldInput",
                  },
                },
              },
            },
            task2: {
              componentRef: {
                spec: {
                  name: "Task2",
                  inputs: [{ name: "input1" }],
                  outputs: [],
                  implementation: { graph: { tasks: {} } },
                },
              },
              arguments: {
                input1: {
                  graphInput: {
                    inputName: "otherInput",
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = renameInput(componentSpec, "oldInput", "newInput");

    // Check that the input name was updated
    expect(result.inputs).toEqual([
      { name: "newInput", type: "String" },
      { name: "otherInput", type: "Integer" },
    ]);

    // Check that the graph spec references were updated
    if (isGraphImplementation(result.implementation)) {
      expect(result.implementation.graph.tasks.task1.arguments?.input1).toEqual(
        {
          graphInput: {
            inputName: "newInput",
          },
        },
      );

      // Check that other references were not affected
      expect(result.implementation.graph.tasks.task2.arguments?.input1).toEqual(
        {
          graphInput: {
            inputName: "otherInput",
          },
        },
      );
    }
  });

  it("should handle component specs without graph implementation", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [{ name: "oldInput", type: "String" }],
      outputs: [],
      implementation: {
        container: {
          image: "alpine",
          command: ["echo", "hello"],
        },
      },
    };

    const result = renameInput(componentSpec, "oldInput", "newInput");

    expect(result.inputs).toEqual([{ name: "newInput", type: "String" }]);
  });
});

describe("renameOutput", () => {
  it("should rename an output and update all graph spec references", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [],
      outputs: [
        { name: "oldOutput", type: "String" },
        { name: "otherOutput", type: "Integer" },
      ],
      implementation: {
        graph: {
          tasks: {
            task1: {
              componentRef: {
                spec: {
                  name: "Task1",
                  inputs: [],
                  outputs: [{ name: "output1" }],
                  implementation: { graph: { tasks: {} } },
                },
              },
            },
          },
          outputValues: {
            oldOutput: {
              taskOutput: {
                taskId: "task1",
                outputName: "output1",
              },
            },
            otherOutput: {
              taskOutput: {
                taskId: "task1",
                outputName: "output1",
              },
            },
          },
        },
      },
    };

    const result = renameOutput(componentSpec, "oldOutput", "newOutput");

    // Check that the output name was updated
    expect(result.outputs).toEqual([
      { name: "newOutput", type: "String" },
      { name: "otherOutput", type: "Integer" },
    ]);

    // Check that the graph spec references were updated
    if (isGraphImplementation(result.implementation)) {
      expect(result.implementation.graph.outputValues?.newOutput).toEqual({
        taskOutput: {
          taskId: "task1",
          outputName: "output1",
        },
      });

      // Check that the old output was removed
      expect(
        result.implementation.graph.outputValues?.oldOutput,
      ).toBeUndefined();

      // Check that other references were not affected
      expect(result.implementation.graph.outputValues?.otherOutput).toEqual({
        taskOutput: {
          taskId: "task1",
          outputName: "output1",
        },
      });
    }
  });

  it("should handle component specs without graph implementation", () => {
    const componentSpec: ComponentSpec = {
      name: "Test Component",
      inputs: [],
      outputs: [{ name: "oldOutput", type: "String" }],
      implementation: {
        container: {
          image: "alpine",
          command: ["echo", "hello"],
        },
      },
    };

    const result = renameOutput(componentSpec, "oldOutput", "newOutput");

    expect(result.outputs).toEqual([{ name: "newOutput", type: "String" }]);
  });
});
