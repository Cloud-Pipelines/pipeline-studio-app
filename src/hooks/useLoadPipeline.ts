import type { Pipeline } from "./pipeline/types";

const SAVED_COMPONENT_SPEC_KEY = "autosaved.component.yaml";

export const useLoadPipeline = (): Pipeline => {
  try {
    const flow = localStorage.getItem(SAVED_COMPONENT_SPEC_KEY);
    if (!flow) return { nodes: [], edges: [] };


    const flowJson = JSON.parse(flow);
    const nodes = flowJson.nodes
    const edges = flowJson.edges;

    return { nodes, edges };
  } catch (err) {
    console.error("Failed to load pipeline:", err);
    return { nodes: [], edges: [] };
  }
};
