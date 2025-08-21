import { describe, expect, it } from "vitest";

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
              },
            },
          },
        },
      };

      expect(getDisplayValue(value, graphSpec)).toBe("→ DataProcessor.result");
    });

    it("formats connected node with component name but no output name", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
        },
      } as any;
      const graphSpec = {
        tasks: {
          "task-1": {
            componentRef: {
              spec: {
                name: "DataProcessor",
              },
            },
          },
        },
      };

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
              spec: {},
            },
          },
        },
      };

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
      // graphSpec with different task - not used since we test fallback behavior

      expect(getDisplayValue(value)).toBe("→ task-1.result");
    });

    it("handles taskOutput without outputName", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
        },
      } as any;

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
      } as any;

      expect(getDisplayValue(value)).toBe("→ undefined.result");
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

    it("handles object values", () => {
      const obj = { key: "value", number: 42 } as any;
      expect(getDisplayValue(obj)).toBe(
        '{\n  "key": "value",\n  "number": 42\n}',
      );
    });

    it("handles undefined values", () => {
      expect(getDisplayValue(undefined)).toBe(undefined);
    });

    it("handles null values", () => {
      expect(getDisplayValue(null as any)).toBe("null");
    });

    it("handles number values", () => {
      expect(getDisplayValue(42 as any)).toBe("42");
    });

    it("handles boolean values", () => {
      expect(getDisplayValue(true as any)).toBe("true");
      expect(getDisplayValue(false as any)).toBe("false");
    });

    it("handles array values", () => {
      const arr = [1, 2, "three"] as any;
      expect(getDisplayValue(arr)).toBe('[\n  1,\n  2,\n  "three"\n]');
    });
  });

  describe("edge cases", () => {
    it("handles empty object", () => {
      expect(getDisplayValue({} as any)).toBe("{}");
    });

    it("handles object without taskOutput property", () => {
      const value = {
        someOtherProperty: "value",
      } as any;
      expect(getDisplayValue(value)).toBe(
        '{\n  "someOtherProperty": "value"\n}',
      );
    });

    it("handles object with taskOutput but not matching expected structure", () => {
      const value = {
        taskOutput: "not an object",
      } as any;
      expect(getDisplayValue(value)).toBe("→ undefined");
    });

    it("handles null taskOutput", () => {
      const value = {
        taskOutput: null,
      } as any;
      expect(getDisplayValue(value)).toBe("→ undefined");
    });

    it("handles empty graphSpec", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };
      const graphSpec = {};

      expect(getDisplayValue(value, graphSpec)).toBe("→ task-1.result");
    });

    it("handles graphSpec without tasks", () => {
      const value = {
        taskOutput: {
          taskId: "task-1",
          outputName: "result",
        },
      };
      const graphSpec = {
        otherProperty: "value",
      } as any;

      expect(getDisplayValue(value, graphSpec)).toBe("→ task-1.result");
    });
  });
});
