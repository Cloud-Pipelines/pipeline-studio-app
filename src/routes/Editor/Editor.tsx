import "@/styles/editor.css";

import { DndContext } from "@dnd-kit/core";
import { ReactFlowProvider } from "@xyflow/react";

import PipelineEditor from "@/components/Editor/PipelineEditor";
import { useLoadComponentSpecFromPath } from "@/hooks/useLoadComponentSpecFromPath";
import { useBackend } from "@/providers/BackendProvider";

const Editor = () => {
  const { backendUrl } = useBackend();
  const { componentSpec } = useLoadComponentSpecFromPath(backendUrl);

  if (!componentSpec) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dndflow">
      <DndContext>
        <ReactFlowProvider>
          <PipelineEditor />
        </ReactFlowProvider>
      </DndContext>
    </div>
  );
};

export default Editor;
