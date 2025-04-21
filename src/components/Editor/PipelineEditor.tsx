import "@/styles/editor.css";

import { Background, Controls, MiniMap } from "@xyflow/react";

import { FlowGraph, FlowSidebar } from "@/components/shared/ReactFlow";
import { PipelineAutoSaver } from "@/utils/PipelineAutoSaver";

const GRID_SIZE = 10;

const PipelineEditor = () => {
  return (
    <>
      <div className="reactflow-wrapper">
        <FlowGraph snapGrid={[GRID_SIZE, GRID_SIZE]} snapToGrid>
          <MiniMap />
          <Controls />
          <Background gap={GRID_SIZE} />
        </FlowGraph>
      </div>
      <FlowSidebar />
      <PipelineAutoSaver />
    </>
  );
};

export default PipelineEditor;
