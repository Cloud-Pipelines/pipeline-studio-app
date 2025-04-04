import type { ComponentSpec } from "@/componentSpec";
import {
  componentSpecToYaml,
  writeComponentToFileListFromText,
} from "@/componentStore";

import { USER_PIPELINES_LIST_NAME } from "./constants";

const useSavePipeline = (componentSpec: ComponentSpec) => {
  const savePipeline = async (name?: string) => {
    if (!componentSpec) {
      return;
    }

    const componentSpecWithNewName = {
      ...componentSpec,
      name: name ?? componentSpec.name ?? "Untitled Pipeline",
    };

    const componentSpecAsYaml = componentSpecToYaml(componentSpecWithNewName);

    await writeComponentToFileListFromText(
      USER_PIPELINES_LIST_NAME,
      componentSpecWithNewName.name,
      componentSpecAsYaml,
    );
  };

  return {
    savePipeline,
  };
};

export default useSavePipeline;
