import type { HydratedComponentReference } from "@/utils/componentSpec";
import { tracking } from "@/utils/tracking";

import { ActionButton } from "../../Buttons/ActionButton";
import { useComponentEditor } from "../../ComponentEditor/ComponentEditorProvider";

interface EditComponentButtonProps {
  componentRef: HydratedComponentReference;
}

export const EditComponentButton = ({
  componentRef,
}: EditComponentButtonProps) => {
  const { openComponentEditor } = useComponentEditor();

  return (
    <ActionButton
      tooltip="Edit Component Definition"
      icon="FilePenLine"
      onClick={() => openComponentEditor({ text: componentRef.text })}
      {...tracking("pipeline_editor.task_node.edit_component")}
    />
  );
};
