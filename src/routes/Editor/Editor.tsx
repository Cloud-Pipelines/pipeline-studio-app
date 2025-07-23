import "@/styles/editor.css";

import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";

import PipelineEditor from "@/components/Editor/PipelineEditor";
import { useLoadComponentSpecFromPath } from "@/hooks/useLoadComponentSpecFromPath";
import { useBackend } from "@/providers/BackendProvider";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";

const Editor = () => {
  const { backendUrl } = useBackend();
  const { componentSpec } = useLoadComponentSpecFromPath(backendUrl);

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
