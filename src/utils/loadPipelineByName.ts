import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import {
  fullyLoadComponentRefFromUrl,
  getAllComponentFilesFromList,
  type ComponentFileEntry,
} from "@/componentStore";
import { getAppSettings } from "@/appSettings";
import { USER_PIPELINES_LIST_NAME } from "./constants";

interface PipelineLibrary {
  components: Array<{
    name: string;
    url: string;
    [key: string]: any;
  }>;
}

const loadPipelineByName = async (name: string) => {
  const decodedName = decodeURIComponent(name);
  const appSettings = getAppSettings();

  try {
    // Fetch user pipelines
    let userPipelines: Map<string, ComponentFileEntry>;
    try {
      userPipelines = await getAllComponentFilesFromList(
        USER_PIPELINES_LIST_NAME,
      );
    } catch (error) {
      console.error("Failed to load user pipelines:", error);
      return {
        experiment: null,
        isLoading: false,
        error: "Failed to load user pipelines",
      };
    }

    // Check if pipeline exists in user pipelines
    const pipeline = userPipelines.get(decodedName);
    if (pipeline) {
      return {
        experiment: pipeline,
        isLoading: false,
        error: null,
      };
    }

    try {
      const pipelineLibrary = await downloadDataWithCache(
        appSettings.pipelineLibraryUrl,
        (data) => loadObjectFromYamlData(data) as PipelineLibrary,
      );

      if (pipelineLibrary?.components) {
        const pipelineLibraryEntry = pipelineLibrary.components.find(
          (entry) => entry.name.toLowerCase() === decodedName.toLowerCase(),
        );

        if (pipelineLibraryEntry) {
          const loadedComponentRef = await fullyLoadComponentRefFromUrl(
            pipelineLibraryEntry.url,
            downloadDataWithCache,
          );

          return {
            experiment: {
              componentRef: loadedComponentRef,
              spec: loadedComponentRef.spec,
            },
            isLoading: false,
            error: null,
          };
        }
      }
    } catch (error) {
      console.error("Failed to load pipeline library:", error);
      // Continue execution - we'll return "Pipeline not found" if it wasn't in user pipelines
    }

    // If we get here, the pipeline wasn't found
    return {
      experiment: null,
      isLoading: false,
      error: "Pipeline not found",
    };
  } catch (error) {
    console.error("Error loading pipeline:", error);
    return {
      experiment: null,
      isLoading: false,
      error: "Error loading pipeline",
    };
  }
};

export default loadPipelineByName;
