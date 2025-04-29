import { Background, Controls, MiniMap } from "@xyflow/react";

import { FlowCanvas } from "@/components/shared/ReactFlow";

const GRID_SIZE = 10;

const PipelineRunPage = () => {
  return (
    <div className="reactflow-wrapper h-full w-full">
      <FlowCanvas
        snapToGrid={true}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        nodesDraggable={false}
        fitView
        readOnly
      >
        <MiniMap position="bottom-left" pannable />
        <Controls style={{ marginLeft: "224px", marginBottom: "36px" }} />
        <Background gap={GRID_SIZE} />
      </FlowCanvas>
    </div>
  );
};

export default PipelineRunPage;
