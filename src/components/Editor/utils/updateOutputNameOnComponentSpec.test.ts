import { describe, expect, it } from "vitest";

import type { ComponentSpec } from "@/utils/componentSpec";
import { isGraphImplementation } from "@/utils/componentSpec";

import { updateOutputNameOnComponentSpec } from "./updateOutputNameOnComponentSpec";

describe("updateOutputNameOnComponentSpec", () => {
  it("should update output name in outputs array", () => {
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {},
          outputValues: {},
        },
      },
      outputs: [
        { name: "oldOutput", type: "string" },
        { name: "otherOutput", type: "number" },
      ],
    };

    const result = updateOutputNameOnComponentSpec(
      componentSpec,
      "oldOutput",
      "newOutput",
    );

    expect(result.outputs).toEqual([
      { name: "newOutput", type: "string" },
      { name: "otherOutput", type: "number" },
    ]);
  });

  it("should update outputValues in graph spec when output is connected", () => {
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {
            task1: {
              componentRef: {
                spec: {
                  name: "task1",
                  implementation: {
                    container: { image: "test-image" },
                  },
                },
              },
            },
          },
          outputValues: {
            oldOutput: {
              taskOutput: {
                taskId: "task1",
                outputName: "taskOutput1",
              },
            },
          },
        },
      },
      outputs: [{ name: "oldOutput", type: "string" }],
    };

    const result = updateOutputNameOnComponentSpec(
      componentSpec,
      "oldOutput",
      "newOutput",
    );

    if (isGraphImplementation(result.implementation)) {
      expect(result.implementation.graph.outputValues).toEqual({
        newOutput: {
          taskOutput: {
            taskId: "task1",
            outputName: "taskOutput1",
          },
        },
      });
      expect(
        result.implementation.graph.outputValues?.oldOutput,
      ).toBeUndefined();
    } else {
      throw new Error("Expected graph implementation");
    }
  });

  it("should not update outputValues when output is not connected", () => {
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {},
          outputValues: {},
        },
      },
      outputs: [{ name: "oldOutput", type: "string" }],
    };

    const result = updateOutputNameOnComponentSpec(
      componentSpec,
      "oldOutput",
      "newOutput",
    );

    if (isGraphImplementation(result.implementation)) {
      expect(result.implementation.graph.outputValues).toEqual({});
    } else {
      throw new Error("Expected graph implementation");
    }
  });

  it("should not update outputValues when oldName equals newName", () => {
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        graph: {
          tasks: {},
          outputValues: {
            oldOutput: {
              taskOutput: {
                taskId: "task1",
                outputName: "taskOutput1",
              },
            },
          },
        },
      },
      outputs: [{ name: "oldOutput", type: "string" }],
    };

    const result = updateOutputNameOnComponentSpec(
      componentSpec,
      "oldOutput",
      "oldOutput",
    );

    if (isGraphImplementation(result.implementation)) {
      expect(result.implementation.graph.outputValues).toEqual({
        oldOutput: {
          taskOutput: {
            taskId: "task1",
            outputName: "taskOutput1",
          },
        },
      });
    } else {
      throw new Error("Expected graph implementation");
    }
  });

  it("should handle component spec without graph implementation", () => {
    const componentSpec: ComponentSpec = {
      name: "test",
      implementation: {
        container: {
          image: "test-image",
        },
      },
      outputs: [{ name: "oldOutput", type: "string" }],
    };

    const result = updateOutputNameOnComponentSpec(
      componentSpec,
      "oldOutput",
      "newOutput",
    );

    expect(result.outputs).toEqual([{ name: "newOutput", type: "string" }]);
    expect(result.implementation).toEqual({
      container: {
        image: "test-image",
      },
    });
  });
});
