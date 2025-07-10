import {
  ControlButton,
  type ControlProps,
  Controls,
  type ReactFlowProps,
} from "@xyflow/react";
import {
  LockKeyhole,
  LockKeyholeOpen,
  Redo,
  SquareDashedMousePointerIcon,
  Undo,
} from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

interface FlowControlsProps extends ControlProps {
  config: ReactFlowProps;
  updateConfig: (config: Partial<ReactFlowProps>) => void;
}

export default function FlowControls({
  config,
  updateConfig,
  ...props
}: FlowControlsProps) {
  const [multiSelectActive, setMultiSelectActive] = useState(false);
  const [lockActive, setLockActive] = useState(!config.nodesDraggable);
  const { undo, redo, canUndo, canRedo } = useComponentSpec();

  const onClickMultiSelect = useCallback(() => {
    updateConfig({
      selectionOnDrag: !multiSelectActive,
      panOnDrag: multiSelectActive,
    });
    setMultiSelectActive(!multiSelectActive);
  }, [multiSelectActive, updateConfig]);

  const handleLockChange = useCallback(() => {
    updateConfig({
      nodesDraggable: lockActive,
    });
    setLockActive(!lockActive);
  }, [lockActive, updateConfig]);

  return (
    <Controls {...props}>
      <ControlButton
        onClick={undo}
        disabled={!canUndo}
        className={cn(!canUndo && "opacity-50 cursor-not-allowed")}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="scale-120" />
      </ControlButton>
      <ControlButton
        onClick={redo}
        disabled={!canRedo}
        className={cn(!canRedo && "opacity-50 cursor-not-allowed")}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="scale-120" />
      </ControlButton>
      {!props.showInteractive && (
        <ControlButton
          onClick={handleLockChange}
          className={cn(lockActive && "bg-gray-100!")}
        >
          {lockActive ? (
            <LockKeyhole className="fill-none! -scale-x-120 scale-y-120" />
          ) : (
            <LockKeyholeOpen className="fill-none! -scale-x-120 scale-y-120" />
          )}
        </ControlButton>
      )}
      <ControlButton
        onClick={onClickMultiSelect}
        className={cn(multiSelectActive && "bg-gray-100!")}
      >
        <SquareDashedMousePointerIcon className="scale-120" />
      </ControlButton>
    </Controls>
  );
}
