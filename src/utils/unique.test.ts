import { describe, expect, it } from "vitest";

import type { ComponentSpec, GraphSpec } from "./componentSpec";
import {
  getUniqueInputName,
  getUniqueOutputName,
  getUniqueTaskName,
} from "./unique";

describe("unique utils", () => {
  describe("getUniqueInputName", () => {
    it("returns original name when no conflicts exist", () => {
      const componentSpec: ComponentSpec = {
        inputs: [],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueInputName(componentSpec, "MyInput");
      expect(result).toBe("MyInput");
    });

    it("adds index when name conflicts exist", () => {
      const componentSpec: ComponentSpec = {
        inputs: [
          { name: "Input", type: "String" },
          { name: "Input 1", type: "String" },
        ],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueInputName(componentSpec, "Input");
      expect(result).toBe("Input 2");
    });

    it("uses default name when no name provided", () => {
      const componentSpec: ComponentSpec = {
        inputs: [],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueInputName(componentSpec);
      expect(result).toBe("Input");
    });
  });

  describe("getUniqueOutputName", () => {
    it("returns original name when no conflicts exist", () => {
      const componentSpec: ComponentSpec = {
        outputs: [],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueOutputName(componentSpec, "MyOutput");
      expect(result).toBe("MyOutput");
    });

    it("adds index when name conflicts exist", () => {
      const componentSpec: ComponentSpec = {
        outputs: [
          { name: "Output", type: "String" },
          { name: "Output 1", type: "String" },
        ],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueOutputName(componentSpec, "Output");
      expect(result).toBe("Output 2");
    });

    it("uses default name when no name provided", () => {
      const componentSpec: ComponentSpec = {
        outputs: [],
        implementation: { container: { image: "test" } },
      };

      const result = getUniqueOutputName(componentSpec);
      expect(result).toBe("Output");
    });
  });

  describe("getUniqueTaskName", () => {
    it("returns original name when no conflicts exist", () => {
      const graphSpec: GraphSpec = {
        tasks: {},
      };

      const result = getUniqueTaskName(graphSpec, "MyTask");
      expect(result).toBe("MyTask");
    });

    it("adds index when name conflicts exist", () => {
      const graphSpec: GraphSpec = {
        tasks: {
          Task: { componentRef: { name: "test" } },
          "Task 1": { componentRef: { name: "test" } },
        },
      };

      const result = getUniqueTaskName(graphSpec, "Task");
      expect(result).toBe("Task 2");
    });

    it("uses default name when no name provided", () => {
      const graphSpec: GraphSpec = {
        tasks: {},
      };

      const result = getUniqueTaskName(graphSpec);
      expect(result).toBe("Task");
    });
  });
});
