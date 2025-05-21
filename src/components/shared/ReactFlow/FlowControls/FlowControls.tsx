import {
  ControlButton,
  type ControlProps,
  Controls,
  type ReactFlowProps,
} from "@xyflow/react";
import { SquareDashedMousePointerIcon } from "lucide-react";
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

  const onClickMultiSelect = useCallback(() => {
    updateConfig({
      selectionOnDrag: !multiSelectActive,
      panOnDrag: multiSelectActive,
    });
    setMultiSelectActive(!multiSelectActive);
  }, [multiSelectActive, updateConfig]);

  return (
    <Controls {...props}>
      <ControlButton
        onClick={onClickMultiSelect}
        className={cn(multiSelectActive && "bg-gray-100!")}
      >
        <SquareDashedMousePointerIcon />
      </ControlButton>
    </Controls>
  );
}
