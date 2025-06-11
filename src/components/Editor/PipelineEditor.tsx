import "@/styles/editor.css";

import {
  Background,
  MiniMap,
  type ReactFlowProps,
  useStore,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

import {
  FlowCanvas,
  FlowControls,
  FlowSidebar,
} from "@/components/shared/ReactFlow";
import { ComponentLibraryProvider } from "@/providers/ComponentLibraryProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { savePipelineSpecToSessionStorage } from "@/utils/storage";

const GRID_SIZE = 10;

const PipelineEditor = () => {
  const { componentSpec } = useComponentSpec();
  const nodes = useStore((store) => store.nodes);

  const [flowConfig, setFlowConfig] = useState<ReactFlowProps>({
    snapGrid: [GRID_SIZE, GRID_SIZE],
    snapToGrid: true,
    panOnDrag: true,
    selectionOnDrag: false,
  });

  const updateFlowConfig = useCallback(
    (updatedConfig: Partial<ReactFlowProps>) => {
      setFlowConfig((prevConfig) => ({
        ...prevConfig,
        ...updatedConfig,
      }));
    },
    [],
  );

  // Auto-save the PipelineSpec to session storage
  useEffect(() => {
    // Fixing issue where a React error would cause all node positions to be recorded as undefined (`!<tag:yaml.org,2002:js/undefined>`)
    // nodes should never be undefined in normal situation.
    if (nodes !== undefined && nodes.length > 0) {
      savePipelineSpecToSessionStorage(componentSpec, nodes);
    }
  }, [componentSpec, nodes]);

  return (
    <ComponentLibraryProvider>
      <FlowSidebar />
      <div className="reactflow-wrapper">
        <FlowCanvas {...flowConfig}>
          <MiniMap position="bottom-left" pannable />
          <FlowControls
            style={{ marginLeft: "224px", marginBottom: "24px" }}
            updateConfig={updateFlowConfig}
          />
          <Background gap={GRID_SIZE} className="bg-slate-50!" />
        </FlowCanvas>
      </div>
    </ComponentLibraryProvider>
  );
};

export default PipelineEditor;
