import { describe, expect, it } from "vitest";

import {
  type ComponentSpec,
  generateArgumentsFromInputs,
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
