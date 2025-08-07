import "@/styles/editor.css";

import { Background, MiniMap, type ReactFlowProps } from "@xyflow/react";
import { useCallback, useState } from "react";

import { CollapsibleContextPanel } from "@/components/shared/ContextPanel/CollapsibleContextPanel";
import {
  FlowCanvas,
  FlowControls,
  FlowSidebar,
} from "@/components/shared/ReactFlow";
import { UndoRedo } from "@/components/shared/UndoRedo";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import { ComponentLibraryProvider } from "@/providers/ComponentLibraryProvider";
import {
  EMPTY_GRAPH_COMPONENT_SPEC,
  useComponentSpec,
} from "@/providers/ComponentSpecProvider";
import { ContextPanelProvider } from "@/providers/ContextPanelProvider";
import { PipelineRunsProvider } from "@/providers/PipelineRunsProvider";

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

  // If the pipeline is loading or the component spec is empty, show a loading spinner
  if (isLoading || componentSpec === EMPTY_GRAPH_COMPONENT_SPEC) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Spinner className="mr-2 w-10 h-10" />
        <p className="text-secondary-foreground">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <PipelineRunsProvider pipelineName={componentSpec.name || ""}>
      <ContextPanelProvider defaultContent={<PipelineDetails />}>
        <ComponentLibraryProvider>
          <FlowSidebar />
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <div className="reactflow-wrapper relative">
                <FlowCanvas {...flowConfig}>
                  <MiniMap position="bottom-left" pannable />
                  <FlowControls
                    className="ml-[224px]! mb-[24px]!"
                    config={flowConfig}
                    updateConfig={updateFlowConfig}
                    showInteractive={false}
                  />
                  <Background gap={GRID_SIZE} className="bg-slate-50!" />
                </FlowCanvas>

                <div className="absolute bottom-0 right-0 p-4">
                  <UndoRedo />
                </div>
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
