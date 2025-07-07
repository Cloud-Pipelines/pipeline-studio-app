import "@/styles/editor.css";

import { Background, MiniMap, type ReactFlowProps } from "@xyflow/react";
import { useCallback, useState } from "react";

import {
  FlowCanvas,
  FlowControls,
  FlowSidebar,
} from "@/components/shared/ReactFlow";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ComponentLibraryProvider } from "@/providers/ComponentLibraryProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { ContextPanelProvider } from "@/providers/ContextPanelProvider";
import { PipelineRunsProvider } from "@/providers/PipelineRunsProvider";

import { CollapsibleContextPanel } from "../shared/ContextPanel/CollapsibleContextPanel";
import PipelineDetails from "./PipelineDetails";

const GRID_SIZE = 10;

const PipelineEditor = () => {
  const { componentSpec, isLoading } = useComponentSpec();

  const [flowConfig, setFlowConfig] = useState<ReactFlowProps>({
    snapGrid: [GRID_SIZE, GRID_SIZE],
    snapToGrid: true,
    panOnDrag: true,
    selectionOnDrag: false,
    nodesDraggable: true,
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
    <PipelineRunsProvider pipelineName={componentSpec.name || ""}>
      <ContextPanelProvider
        defaultContent={
          <PipelineDetails
            componentSpec={componentSpec}
            isLoading={isLoading}
          />
        }
      >
        <ComponentLibraryProvider>
          <FlowSidebar />
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <div className="reactflow-wrapper">
                <FlowCanvas {...flowConfig}>
                  <MiniMap position="bottom-left" pannable />
                  <FlowControls
                    className="ml-[224px]! mb-[24px]!"
                    config={flowConfig}
                    updateConfig={updateFlowConfig}
                    showInteractive
                  />
                  <Background gap={GRID_SIZE} className="bg-slate-50!" />
                </FlowCanvas>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <CollapsibleContextPanel />
          </ResizablePanelGroup>
        </ComponentLibraryProvider>
      </ContextPanelProvider>
    </PipelineRunsProvider>
  );
};

export default PipelineEditor;
