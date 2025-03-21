import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { importPipelineFromYaml } from "./importPipeline";
import * as componentStore from "@/componentStore";
import { USER_PIPELINES_LIST_NAME } from "./constants";
import * as componentSpecModule from "@/componentSpec";

vi.mock("@/componentStore", () => ({
  componentSpecToYaml: vi.fn(),
  getComponentFileFromList: vi.fn(),
  writeComponentToFileListFromText: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/componentSpec", () => ({
  isGraphImplementation: vi.fn(),
}));

describe("importPipelineFromYaml", () => {
  const validYamlContent = `
name: Test Pipeline
metadata:
  annotations:
    sdk: https://cloud-pipelines.net/pipeline-editor/
implementation:
  graph:
    tasks: {}
    outputValues: {}
`;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to returning true for valid tests
    vi.mocked(componentSpecModule.isGraphImplementation).mockReturnValue(true);
    // Default for componentSpecToYaml
    vi.mocked(componentStore.componentSpecToYaml).mockReturnValue(
      "mocked-yaml",
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should successfully import a valid pipeline", async () => {
    // Mock no existing pipeline with the same name
    vi.mocked(componentStore.getComponentFileFromList).mockResolvedValue(null);

    const result = await importPipelineFromYaml(validYamlContent);

    // Expect the function to call componentSpecToYaml
    expect(componentStore.componentSpecToYaml).toHaveBeenCalled();

    // Expect writeComponentToFileListFromText to be called with correct parameters
    expect(
      componentStore.writeComponentToFileListFromText,
    ).toHaveBeenCalledWith(
      USER_PIPELINES_LIST_NAME,
      "Test Pipeline",
      "mocked-yaml",
    );

    // Expect successful result
    expect(result).toEqual({
      name: "Test Pipeline",
      overwritten: false,
      successful: true,
    });
  });

  it("should generate a unique name when a name collision occurs", async () => {
    // Mock existing pipeline with the same name, but not with "(1)" suffix
    vi.mocked(componentStore.getComponentFileFromList).mockImplementation(
      async (_, name) => {
        if (name === "Test Pipeline") {
          return {} as any;
        }
        return null;
      },
    );

    // Mock the console.error to prevent test output pollution
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await importPipelineFromYaml(validYamlContent, false);

    // Since we're now renaming rather than erroring, expect a successful result
    expect(result.successful).toBe(true);
    expect(result.name).toBe("Test Pipeline (1)");
    expect(result.errorMessage).toContain("was renamed");

    // Expect writeComponentToFileListFromText to be called with the new name and YAML
    expect(
      componentStore.writeComponentToFileListFromText,
    ).toHaveBeenCalledWith(
      USER_PIPELINES_LIST_NAME,
      "Test Pipeline (1)",
      "mocked-yaml",
    );
  });

  it("should increment counter when multiple name collisions occur", async () => {
    // Mock existing pipelines with the name and first two numbered variants
    vi.mocked(componentStore.getComponentFileFromList).mockImplementation(
      async (_, name) => {
        if (
          name === "Test Pipeline" ||
          name === "Test Pipeline (1)" ||
          name === "Test Pipeline (2)"
        ) {
          return {} as any;
        }
        return null;
      },
    );

    // Mock the console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await importPipelineFromYaml(validYamlContent, false);

    // Expect a successful result with the name incremented to (3)
    expect(result.successful).toBe(true);
    expect(result.name).toBe("Test Pipeline (3)");

    // Expect writeComponentToFileListFromText to be called with the new name and YAML
    expect(
      componentStore.writeComponentToFileListFromText,
    ).toHaveBeenCalledWith(
      USER_PIPELINES_LIST_NAME,
      "Test Pipeline (3)",
      "mocked-yaml",
    );
  });

  it("should handle invalid YAML content", async () => {
    // Mock the console.error to prevent test output pollution
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await importPipelineFromYaml("invalid: yaml: content: -");

    // Expect unsuccessful result
    expect(result.successful).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.name).toBe("");
  });

  it("should handle non-graph pipelines", async () => {
    // Mock isGraphImplementation to return false
    vi.mocked(componentSpecModule.isGraphImplementation).mockReturnValue(false);

    // Mock the console.error
    vi.spyOn(console, "error").mockImplementation(() => {});

    const containerPipeline = `
name: Container Pipeline
implementation:
  container:
    image: test-image
    command: ["echo", "hello"]
`;

    const result = await importPipelineFromYaml(containerPipeline);

    // Expect unsuccessful result
    expect(result.successful).toBe(false);
    expect(result.errorMessage).toContain("graph-based pipeline");

    // Expect the writing function not to be called
    expect(
      componentStore.writeComponentToFileListFromText,
    ).not.toHaveBeenCalled();
  });

  it("should use default name for unnamed pipelines", async () => {
    // Mock isGraphImplementation to return true
    vi.mocked(componentSpecModule.isGraphImplementation).mockReturnValue(true);

    const unnamedYaml = `
metadata:
  annotations:
    sdk: https://cloud-pipelines.net/pipeline-editor/
implementation:
  graph:
    tasks: {}
    outputValues: {}
`;

    vi.mocked(componentStore.getComponentFileFromList).mockResolvedValue(null);

    const result = await importPipelineFromYaml(unnamedYaml);

    // Expect writeComponentToFileListFromText to be called with default name
    expect(
      componentStore.writeComponentToFileListFromText,
    ).toHaveBeenCalledWith(
      USER_PIPELINES_LIST_NAME,
      "Imported Pipeline",
      "mocked-yaml",
    );

    expect(result.name).toBe("Imported Pipeline");
  });
});
