import "@/styles/editor.css";

import { Background, MiniMap, type ReactFlowProps } from "@xyflow/react";
import { SaveOff } from "lucide-react";
import { useCallback, useState } from "react";

import {
  FlowCanvas,
  FlowControls,
  FlowSidebar,
} from "@/components/shared/ReactFlow";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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

import { CollapsibleContextPanel } from "../shared/ContextPanel/CollapsibleContextPanel";
import PipelineDetails from "./PipelineDetails";

const GRID_SIZE = 10;

const PipelineEditor = () => {
  const {
    componentSpec,
    isLoading,
    isDirty,
    saveComponentSpec,
    resetComponentSpec,
  } = useComponentSpec();

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

  const handleSave = useCallback(() => {
    saveComponentSpec(componentSpec.name ?? "");
  }, [saveComponentSpec]);

  const handleUndo = useCallback(() => {
    resetComponentSpec();
  }, [resetComponentSpec]);

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
    <>
      <PipelineRunsProvider pipelineName={componentSpec.name || ""}>
        <ContextPanelProvider
          defaultContent={<PipelineDetails componentSpec={componentSpec} />}
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
                      showInteractive={false}
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
      {isDirty && (
        <div className="fixed bottom-16 w-full flex justify-center z-50">
          <Alert className="w-fit shadow flex items-center" variant="info">
            <SaveOff className="mb-1" />
            <AlertTitle>Unsaved changes</AlertTitle>
            <div className="flex items-center gap-2 ml-4">
              <Button size="xs" variant="outline" onClick={handleSave}>
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={handleUndo}>
                Discard
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  );
};

export default PipelineEditor;
