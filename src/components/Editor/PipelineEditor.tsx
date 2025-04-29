import "@/styles/editor.css";

import { Background, Controls, MiniMap, useStore } from "@xyflow/react";
import { useEffect } from "react";

import { FlowCanvas, FlowSidebar } from "@/components/shared/ReactFlow";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { savePipelineSpecToSessionStorage } from "@/utils/storage";

const GRID_SIZE = 10;

// Auto-saver is extracted to its own child component since useStoreState in the parent causes infinite re-rendering
// (each render of GraphComponentSpecFlow seems to change the Redux store).
// This component seems to be triggered for every node movement, so even pure layout changes are saved.

const PipelineEditor = () => {
  const { componentSpec } = useComponentSpec();
  const nodes = useStore((store) => store.nodes);

  // Auto-save the PipelineSpec to session storage
  useEffect(() => {
    // Fixing issue where a React error would cause all node positions to be recorded as undefined (`!<tag:yaml.org,2002:js/undefined>`)
    // nodes should never be undefined in normal situation.
    if (nodes !== undefined && nodes.length > 0) {
      savePipelineSpecToSessionStorage(componentSpec, nodes);
    }
  }, [componentSpec, nodes]);

  return (
    <>
      <div className="reactflow-wrapper">
        <FlowCanvas snapGrid={[GRID_SIZE, GRID_SIZE]} snapToGrid>
          <MiniMap position="bottom-left" pannable />
          <Controls style={{ marginLeft: "224px", marginBottom: "36px" }} />
          <Background gap={GRID_SIZE} />
        </FlowCanvas>
      </div>
      <FlowSidebar />
    </>
  );
};

export default PipelineEditor;
