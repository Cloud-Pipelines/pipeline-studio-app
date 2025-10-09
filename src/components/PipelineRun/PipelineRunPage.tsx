import { Background, MiniMap, type ReactFlowProps } from "@xyflow/react";
import { useCallback, useState } from "react";

import { FlowCanvas, FlowControls } from "@/components/shared/ReactFlow";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ComponentLibraryProvider } from "@/providers/ComponentLibraryProvider";
import { ContextPanelProvider } from "@/providers/ContextPanelProvider";

import { CollapsibleContextPanel } from "../shared/ContextPanel/CollapsibleContextPanel";
import { RootExecutionStatusProvider } from "./RootExecutionStatusProvider";
import { RunDetails } from "./RunDetails";

const GRID_SIZE = 10;

const PipelineRunPage = ({ rootExecutionId }: { rootExecutionId: string }) => {
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
    <RootExecutionStatusProvider rootExecutionId={rootExecutionId}>
      <ContextPanelProvider defaultContent={<RunDetails />}>
        <ComponentLibraryProvider>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <div className="reactflow-wrapper h-full w-full">
                <FlowCanvas {...flowConfig} readOnly>
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
    </RootExecutionStatusProvider>
  );
};

export default PipelineRunPage;
