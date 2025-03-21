import yaml from "js-yaml";
import { USER_PIPELINES_LIST_NAME } from "./constants";
import {
  componentSpecToYaml,
  getComponentFileFromList,
  writeComponentToFileListFromText,
} from "@/componentStore";
import type { ComponentSpec } from "@/componentSpec";
import { isGraphImplementation } from "@/componentSpec";

interface ImportResult {
  name: string;
  overwritten: boolean;
  successful: boolean;
  errorMessage?: string;
}

/**
 * Generates a unique pipeline name by adding a numbered suffix when a collision occurs
 * @param baseName The original pipeline name
 * @returns A promise resolving to a unique pipeline name
 */
async function generateUniquePipelineName(baseName: string): Promise<string> {
  // First check if the base name is available
  const existingPipeline = await getComponentFileFromList(
    USER_PIPELINES_LIST_NAME,
    baseName,
  );

  if (!existingPipeline) {
    return baseName; // Base name is available
  }

  // Base name exists, try adding numbers
  let counter = 1;
  let newName = `${baseName} (${counter})`;

  // Keep checking until we find an available name
  while (await getComponentFileFromList(USER_PIPELINES_LIST_NAME, newName)) {
    counter++;
    newName = `${baseName} (${counter})`;
  }

  return newName;
}

/**
 * Imports a pipeline from YAML content and saves it to the user's pipeline library
 * @param yamlContent The YAML content to import as a string
 * @param overwrite Optional. Whether to overwrite if a pipeline with the same name exists
 * @returns The result of the import, with the pipeline name and unique flag
 */
export async function importPipelineFromYaml(
  yamlContent: string,
  overwrite = false,
): Promise<ImportResult> {
  try {
    // Parse the YAML content to get the component spec
    const componentSpec = yaml.load(yamlContent) as ComponentSpec;

    if (!componentSpec || typeof componentSpec !== "object") {
      const errorMessage =
        "Invalid YAML content. Could not parse as a component spec.";
      console.error(errorMessage);
      return {
        name: "",
        overwritten: false,
        successful: false,
        errorMessage,
      };
    }

    // Validate the component spec has the required structure
    if (
      !componentSpec.implementation ||
      !isGraphImplementation(componentSpec.implementation)
    ) {
      const errorMessage =
        "Invalid pipeline structure. This doesn't appear to be a graph-based pipeline.";
      console.error(errorMessage);
      return {
        name: "",
        overwritten: false,
        successful: false,
        errorMessage,
      };
    }

    // Use the name from the YAML or default to "Imported Pipeline"
    let pipelineName = componentSpec.name || "Imported Pipeline";
    let wasRenamed = false;

    // Check if a pipeline with this name already exists
    const existingPipeline = await getComponentFileFromList(
      USER_PIPELINES_LIST_NAME,
      pipelineName,
    );

    // If exists and we're not overwriting, generate a unique name
    if (existingPipeline && !overwrite) {
      const originalName = pipelineName;
      pipelineName = await generateUniquePipelineName(pipelineName);
      wasRenamed = pipelineName !== originalName;

      // Update the component spec name to match the new name
      componentSpec.name = pipelineName;
    }

    // Standardize the YAML to ensure consistent format
    // This also ensures the ComponentSpec is valid
    const standardizedYaml = componentSpecToYaml(componentSpec);

    // Save the pipeline to IndexedDB
    await writeComponentToFileListFromText(
      USER_PIPELINES_LIST_NAME,
      pipelineName,
      standardizedYaml,
    );

    return {
      name: pipelineName,
      overwritten: Boolean(existingPipeline && overwrite),
      successful: true,
      errorMessage: wasRenamed
        ? `Pipeline was renamed to "${pipelineName}" to avoid name conflict.`
        : undefined,
    };
  } catch (error) {
    let errorMessage = "Failed to import pipeline.";

    // Provide more specific error messages for different error types
    if (error instanceof yaml.YAMLException) {
      errorMessage = `YAML syntax error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Failed to import pipeline:", error);
    return {
      name: "",
      overwritten: false,
      successful: false,
      errorMessage,
    };
  }
}

/**
 * Imports a pipeline from a File object (from a file input)
 * @param file The file object from the file input
 * @param overwrite Optional. Whether to overwrite existing pipeline
 * @returns The result of the import operation
 */
export async function importPipelineFromFile(
  file: File,
  overwrite = false,
): Promise<ImportResult> {
  try {
    const yamlContent = await file.text();
    return importPipelineFromYaml(yamlContent, overwrite);
  } catch (error) {
    let errorMessage = "Failed to read file.";
    if (error instanceof Error) {
      errorMessage = `File error: ${error.message}`;
    }

    console.error("Failed to read file:", error);
    return {
      name: "",
      overwritten: false,
      successful: false,
      errorMessage,
    };
  }
}
