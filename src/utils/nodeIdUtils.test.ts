import { describe, expect,it } from "vitest";

import {
  inputNameToNodeId,
  nodeIdToInputName,
  nodeIdToOutputName,
  nodeIdToTaskId,
  outputNameToNodeId,
  taskIdToNodeId,
} from "./nodeIdUtils";

describe("nodeIdUtils", () => {
  describe("nodeIdToTaskId", () => {
    it('should extract task ID by removing the "task_" prefix', () => {
      expect(nodeIdToTaskId("task_123")).toBe("123");
      expect(nodeIdToTaskId("task_abc")).toBe("abc");
      expect(nodeIdToTaskId("task_")).toBe("");
    });

    it("should return the original string if no prefix exists", () => {
      expect(nodeIdToTaskId("123")).toBe("123");
    });
  });

  describe("nodeIdToInputName", () => {
    it('should extract input name by removing the "input_" prefix', () => {
      expect(nodeIdToInputName("input_name")).toBe("name");
      expect(nodeIdToInputName("input_data")).toBe("data");
      expect(nodeIdToInputName("input_")).toBe("");
    });

    it("should return the original string if no prefix exists", () => {
      expect(nodeIdToInputName("name")).toBe("name");
    });
  });

  describe("nodeIdToOutputName", () => {
    it('should extract output name by removing the "output_" prefix', () => {
      expect(nodeIdToOutputName("output_result")).toBe("result");
      expect(nodeIdToOutputName("output_data")).toBe("data");
      expect(nodeIdToOutputName("output_")).toBe("");
    });

    it("should return the original string if no prefix exists", () => {
      expect(nodeIdToOutputName("result")).toBe("result");
    });
  });

  describe("taskIdToNodeId", () => {
    it('should create a task node ID by adding the "task_" prefix', () => {
      expect(taskIdToNodeId("123")).toBe("task_123");
      expect(taskIdToNodeId("abc")).toBe("task_abc");
      expect(taskIdToNodeId("")).toBe("task_");
    });
  });

  describe("inputNameToNodeId", () => {
    it('should create an input node ID by adding the "input_" prefix', () => {
      expect(inputNameToNodeId("name")).toBe("input_name");
      expect(inputNameToNodeId("data")).toBe("input_data");
      expect(inputNameToNodeId("")).toBe("input_");
    });
  });

  describe("outputNameToNodeId", () => {
    it('should create an output node ID by adding the "output_" prefix', () => {
      expect(outputNameToNodeId("result")).toBe("output_result");
      expect(outputNameToNodeId("data")).toBe("output_data");
      expect(outputNameToNodeId("")).toBe("output_");
    });
  });
});
