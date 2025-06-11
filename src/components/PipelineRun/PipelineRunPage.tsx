import { Background, MiniMap, type ReactFlowProps } from "@xyflow/react";
import { useCallback, useState } from "react";

import { FlowCanvas, FlowControls } from "@/components/shared/ReactFlow";
import { ComponentLibraryProvider } from "@/providers/ComponentLibraryProvider";

const GRID_SIZE = 10;

const PipelineRunPage = () => {
  const [flowConfig, setFlowConfig] = useState<ReactFlowProps>({
    snapGrid: [GRID_SIZE, GRID_SIZE],
    snapToGrid: true,
    panOnDrag: true,
    selectionOnDrag: false,
    nodesDraggable: false,
    fitView: true,
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

  return (
    <ComponentLibraryProvider>
      <div className="reactflow-wrapper h-full w-full">
        <FlowCanvas {...flowConfig} readOnly>
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

export default PipelineRunPage;
