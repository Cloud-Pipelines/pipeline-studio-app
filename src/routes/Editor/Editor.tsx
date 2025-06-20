import "@/styles/editor.css";

import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";

import PipelineEditor from "@/components/Editor/PipelineEditor";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";

const Editor = () => {
  const { componentSpec } = useLoadComponentSpecAndDetailsFromId();

  return (
    <ComponentSpecProvider spec={componentSpec}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <PipelineEditor />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

export default Editor;
