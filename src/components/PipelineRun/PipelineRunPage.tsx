import { Background, Controls, MiniMap } from "@xyflow/react";

import { FlowGraph } from "@/components/shared/ReactFlow";

const GRID_SIZE = 10;

const PipelineRunPage = () => {
  return (
    <div className="reactflow-wrapper h-full w-full">
      <FlowGraph
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        nodesDraggable={false}
        fitView
        readOnly
      >
        <MiniMap />
        <Controls />
        <Background gap={GRID_SIZE} />
      </FlowGraph>
    </div>
  );
};

export default PipelineRunPage;
