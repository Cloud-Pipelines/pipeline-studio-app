import {
  ControlButton,
  type ControlProps,
  Controls,
  type ReactFlowProps,
} from "@xyflow/react";
import {
  LockKeyhole,
  LockKeyholeOpen,
  SquareDashedMousePointerIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

interface FlowControlsProps extends ControlProps {
  updateConfig: (config: Partial<ReactFlowProps>) => void;
}

export default function FlowControls({
  updateConfig,
  ...props
}: FlowControlsProps) {
  const [multiSelectActive, setMultiSelectActive] = useState(false);
  const [lockActive, setLockActive] = useState(true);

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
