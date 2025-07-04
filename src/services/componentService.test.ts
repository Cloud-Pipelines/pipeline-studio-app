import { beforeEach, describe, expect, it, vi } from "vitest";

import * as localforge from "@/utils/localforge";

import {
  generateDigest,
  getExistingAndNewUserComponent,
  inputsWithInvalidArguments,
  parseComponentData,
} from "./componentService";

// Mock the localforge module
vi.mock("@/utils/localforge");

describe("componentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateDigest", () => {
    it("generates a SHA-256 digest for text", async () => {
      const text = "test component data";
      const digest = await generateDigest(text);

      expect(digest).toBeDefined();
      expect(typeof digest).toBe("string");
      expect(digest.length).toBe(64); // SHA-256 produces 64 hex characters
    });

    it("generates consistent digests for same input", async () => {
      const text = "test component data";
      const digest1 = await generateDigest(text);
      const digest2 = await generateDigest(text);

      expect(digest1).toBe(digest2);
    });

    it("generates different digests for different inputs", async () => {
      const digest1 = await generateDigest("test1");
      const digest2 = await generateDigest("test2");

      expect(digest1).not.toBe(digest2);
    });
  });

  describe("parseComponentData", () => {
    it("parses valid YAML component data", () => {
      const yamlData = `
name: TestComponent
description: A test component
inputs:
  - name: input1
    type: String
implementation:
  container:
    image: test-image
      `;

      const result = parseComponentData(yamlData);

      expect(result).toBeDefined();
      expect(result?.name).toBe("TestComponent");
      expect(result?.description).toBe("A test component");
      expect(result?.inputs).toHaveLength(1);
      expect(result?.inputs?.[0].name).toBe("input1");
    });

    it("returns null for invalid YAML data", () => {
      const invalidYaml = "invalid: yaml: data: [";

      const result = parseComponentData(invalidYaml);

      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parseComponentData("");

      expect(result).toBeUndefined();
    });
  });

  describe("getExistingAndNewUserComponent", () => {
    it("returns new component when no existing component found", async () => {
      const mockGetAllUserComponents = vi.mocked(
        localforge.getAllUserComponents
      );
      mockGetAllUserComponents.mockResolvedValue([]);

      const componentData = `
name: NewComponent
description: A new component
implementation:
  container:
    image: new-image
      `;

      const result = await getExistingAndNewUserComponent(componentData);

      expect(result.existingComponent).toBeUndefined();
      expect(result.newComponent).toBeDefined();
      expect(result.newComponent?.name).toBe("NewComponent");
    });

    it("returns existing component when found with same name but different digest", async () => {
      const existingComponent = {
        name: "TestComponent",
        componentRef: {
          name: "TestComponent",
          digest: "old-digest",
        },
        creationTime: new Date(),
        modificationTime: new Date(),
        data: new ArrayBuffer(0),
      };

      const mockGetAllUserComponents = vi.mocked(
        localforge.getAllUserComponents
      );
      mockGetAllUserComponents.mockResolvedValue([existingComponent]);

      const componentData = `
name: TestComponent
description: A test component
implementation:
  container:
    image: test-image
      `;

      const result = await getExistingAndNewUserComponent(componentData);

      expect(result.existingComponent).toBeDefined();
      expect(result.existingComponent?.name).toBe("TestComponent");
      expect(result.newComponent).toBeDefined();
      expect(result.newComponent?.name).toBe("TestComponent");
    });

    it("returns undefined for both when component data is invalid", async () => {
      const mockGetAllUserComponents = vi.mocked(
        localforge.getAllUserComponents
      );
      mockGetAllUserComponents.mockResolvedValue([]);

      const invalidData = "invalid: yaml: data: [";

      const result = await getExistingAndNewUserComponent(invalidData);

      expect(result.existingComponent).toBeUndefined();
      expect(result.newComponent).toBeUndefined();
    });
  });

  describe("inputsWithInvalidArguments", () => {
    it("returns empty array when inputs or taskSpec is undefined", () => {
      expect(inputsWithInvalidArguments(undefined, undefined)).toEqual([]);
      expect(inputsWithInvalidArguments([], undefined)).toEqual([]);
      expect(inputsWithInvalidArguments(undefined, {} as any)).toEqual([]);
    });

    it("returns inputs without default values, optional flags, or arguments", () => {
      const inputs = [
        { name: "required1", type: "String" },
        { name: "required2", type: "String" },
        { name: "optional1", type: "String", optional: true },
        { name: "withDefault", type: "String", default: "default value" },
        { name: "withArgument", type: "String" },
      ];

      const taskSpec = {
        componentRef: { name: "test" },
        arguments: {
          withArgument: "provided value",
        },
      };

      const result = inputsWithInvalidArguments(inputs, taskSpec);

      expect(result).toEqual(["required1", "required2"]);
    });

    it("returns all required inputs when no arguments provided", () => {
      const inputs = [
        { name: "input1", type: "String" },
        { name: "input2", type: "String" },
      ];

      const taskSpec = {
        componentRef: { name: "test" },
        arguments: {},
      };

      const result = inputsWithInvalidArguments(inputs, taskSpec);

      expect(result).toEqual(["input1", "input2"]);
    });

    it("returns empty array when all inputs are optional or have defaults", () => {
      const inputs = [
        { name: "optional1", type: "String", optional: true },
        { name: "withDefault", type: "String", default: "default value" },
      ];

      const taskSpec = {
        componentRef: { name: "test" },
        arguments: {},
      };

      const result = inputsWithInvalidArguments(inputs, taskSpec);

      expect(result).toEqual([]);
    });
  });
});
