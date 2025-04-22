import "@/styles/editor.css";

import { DndContext } from "@dnd-kit/core";
import { useLocation } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";

import PipelineEditor from "@/components/Editor/PipelineEditor";
import { ComponentSpecProvider } from "@/providers/ComponentSpecProvider";

const Editor = () => {
  const location = useLocation();
  const experimentName = location.pathname.split("/").pop() || "";

  return (
    <ComponentSpecProvider experimentName={experimentName}>
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
