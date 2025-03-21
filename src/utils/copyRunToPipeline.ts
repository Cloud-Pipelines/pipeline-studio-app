import type { ComponentSpec } from "@/componentSpec";
import { componentSpecToYaml, getComponentFileFromList, writeComponentToFileListFromText } from "@/componentStore";
import { APP_ROUTES, USER_PIPELINES_LIST_NAME } from "./constants";

export const copyRunToPipeline = async (componentSpec: ComponentSpec) => {
    if (!componentSpec) {
      console.error("No component spec found to copy");
      return {
        url: null,
        name: null
      }
    }

    try {
      const cleanComponentSpec = JSON.parse(JSON.stringify(componentSpec));

      if (cleanComponentSpec.implementation?.graph?.tasks) {
        Object.values(cleanComponentSpec.implementation.graph.tasks).forEach((task: any) => {
          if (task.annotations && 'status' in task.annotations) {
            delete task.annotations.status;
          }
        });
      }

      // Generate a name for the copied pipeline
      const originalName = cleanComponentSpec.name || "Unnamed Pipeline";
      let newName = originalName;

      // Check if the name already exists and append a number if needed
      let nameExists = true;
      let counter = 1;

      while (nameExists) {
        const existingFile = await getComponentFileFromList(
          USER_PIPELINES_LIST_NAME,
          newName
        );

        if (existingFile === null) {
          nameExists = false;
        } else {
          const countNumber = counter > 1 ? " " + counter : "";
          newName = `${originalName} (Copy${countNumber})`;
          counter++;
        }
      }

      cleanComponentSpec.name = newName;

      const componentText = componentSpecToYaml(cleanComponentSpec);
      await writeComponentToFileListFromText(
        USER_PIPELINES_LIST_NAME,
        newName,
        componentText
      );

      const urlName = encodeURIComponent(newName);

      return {
        url: APP_ROUTES.PIPELINE_EDITOR.replace('$name', urlName),
        name: newName
      }

    } catch (error) {
      console.error("Error cloning pipeline:", error);
      return {
        url: null,
        name: null
      }
    }
  };
