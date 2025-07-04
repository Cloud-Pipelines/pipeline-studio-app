import "@/styles/editor.css";

import {
  Background,
  MiniMap,
  type ReactFlowProps,
  useStoreApi,
} from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";

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
import { savePipelineSpecToSessionStorage } from "@/utils/storage";

import { CollapsibleContextPanel } from "../shared/ContextPanel/CollapsibleContextPanel";
import PipelineDetails from "./PipelineDetails";

const GRID_SIZE = 10;

const PipelineEditor = () => {
  const { componentSpec, isLoading } = useComponentSpec();
  const store = useStoreApi();

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

  // Auto-save the PipelineSpec to session storage
  useEffect(() => {
    // Fixing issue where a React error would cause all node positions to be recorded as undefined (`!<tag:yaml.org,2002:js/undefined>`)
    // nodes should never be undefined in normal situation.
    const currentNodes = store
      .getState()
      .nodes.filter((node) => node.type === "task");

    if (currentNodes !== undefined && currentNodes.length > 0) {
      savePipelineSpecToSessionStorage(componentSpec, currentNodes);
    }
  }, [componentSpec]);

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
