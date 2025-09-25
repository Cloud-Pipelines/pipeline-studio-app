import { describe, expect, it } from "vitest";

import type { GraphSpec, TaskOutputArgument } from "@/utils/componentSpec";

import { getDisplayValue } from "./handleUtils";

describe("getDisplayValue", () => {
  describe("connected node values (taskOutput)", () => {
    it("formats connected node with component name and output name", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };
      const graphSpec = {
        tasks: {
          "task-1": {
            componentRef: {
              spec: {
                name: "DataProcessor",
                implementation: {
                  graph: { inputs: {}, tasks: {}, outputs: {} },
                },
              },
            },
          },
        },
      } as GraphSpec;

      expect(getDisplayValue(value, graphSpec)).toBe("→ DataProcessor.result");
    });

    it("formats connected node with component name but no output name", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
        },
      } as TaskOutputArgument;
      const graphSpec = {
        tasks: {
          "task-1": {
            componentRef: {
              spec: {
                name: "DataProcessor",
                implementation: {
                  graph: { inputs: {}, tasks: {}, outputs: {} },
                },
              },
            },
          },
        },
      } as GraphSpec;

      expect(getDisplayValue(value, graphSpec)).toBe("→ DataProcessor");
    });

    it("falls back to taskId when no component name is available", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };
      const graphSpec = {
        tasks: {
          "task-1": {
            componentRef: {
              spec: {
                implementation: {
                  graph: { inputs: {}, tasks: {}, outputs: {} },
                },
              },
            },
          },
        },
      } as GraphSpec;

      expect(getDisplayValue(value, graphSpec)).toBe("→ task-1.result");
    });

    it("falls back to taskId when no graphSpec is provided", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };

      expect(getDisplayValue(value)).toBe("→ task-1.result");
    });

    it("falls back to taskId when task not found in graphSpec", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };

      expect(getDisplayValue(value)).toBe("→ task-1.result");
    });

    it("handles taskOutput without outputName", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
        },
      } as TaskOutputArgument;

      expect(getDisplayValue(value)).toBe("→ task-1");
    });

    it("handles taskOutput with empty outputName", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "",
        },
      };

      expect(getDisplayValue(value)).toBe("→ task-1");
    });

    it("handles missing taskId gracefully", () => {
      const value = {
        taskOutput: {
          outputName: "result",
        },
      } as TaskOutputArgument;

      expect(getDisplayValue(value)).toBe("→ undefined.result");
    });
  });

  describe("connected graph input values (graphInput)", () => {
    it("formats graph input with input name", () => {
      const value = {
        graphInput: {
          inputName: "user_data",
        },
      };

      expect(getDisplayValue(value)).toBe("→ user_data");
    });

    it("handles graph input with empty input name", () => {
      const value = {
        graphInput: {
          inputName: "",
        },
      };

      expect(getDisplayValue(value)).toBe("→ ");
    });
  });

  describe("non-connected values", () => {
    it("handles string values", () => {
      expect(getDisplayValue("simple string")).toBe("simple string");
    });

    it("handles JSON string values", () => {
      const jsonString = '{"key": "value", "number": 42}';
      expect(getDisplayValue(jsonString)).toBe(
        '{\n  "key": "value",\n  "number": 42\n}',
      );
    });

    it("handles undefined values", () => {
      expect(getDisplayValue(undefined)).toBe(undefined);
    });
  });

  describe("edge cases", () => {
    it("handles empty graphSpec", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };
      const graphSpec = {
        tasks: {},
      } as GraphSpec;

      expect(getDisplayValue(value, graphSpec)).toBe("→ task-1.result");
    });
  });
});
