import yaml from "js-yaml";
import type { ComponentSpec } from "../componentSpec";
import type { Pipeline } from "./pipeline/types";
import { getTaskNodes, getInputNodes } from "./pipeline/getNodes";
import { getEdges } from "./pipeline/getEdges";
import { isValidComponentSpec } from "./pipeline/utils";

const SAVED_COMPONENT_SPEC_KEY = "autosaved.component.yaml";

export const useLoadPipeline = (): Pipeline => {
  try {
    const componentText = localStorage.getItem(SAVED_COMPONENT_SPEC_KEY);
    if (!componentText) return { nodes: [], edges: [] };

    const loadedYaml = yaml.load(componentText);
    if (!loadedYaml || typeof loadedYaml !== "object") {
      console.warn("Invalid YAML structure");
      return { nodes: [], edges: [] };
    }

    const spec = loadedYaml as ComponentSpec;
    if (!isValidComponentSpec(spec)) {
      console.warn("Invalid ComponentSpec structure");
      return { nodes: [], edges: [] };
    }

    const taskNodes = getTaskNodes(spec);
    const inputNodes = getInputNodes(spec);
    const edges = getEdges(spec);

    return { nodes: [...taskNodes, ...inputNodes], edges };
  } catch (err) {
    console.error("Failed to load pipeline:", err);
    return { nodes: [], edges: [] };
  }
};
