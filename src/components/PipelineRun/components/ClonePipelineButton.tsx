import { CopyPlus } from "lucide-react";
import { useCallback } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { usePipelineRun } from "@/providers/PipelineRunProvider";
import type { ComponentSpec } from "@/utils/componentSpec";

type ClonePipelineButtonProps = {
  componentSpec: ComponentSpec;
};

export const ClonePipelineButton = ({
  componentSpec,
}: ClonePipelineButtonProps) => {
  const { clone, isCloning } = usePipelineRun();

  const handleClone = useCallback(() => {
    clone(componentSpec);
  }, [clone, componentSpec]);

  return (
    <TooltipButton
      variant="outline"
      onClick={handleClone}
      tooltip="Clone pipeline"
      disabled={isCloning}
      data-testid="clone-pipeline-run-button"
    >
      <CopyPlus className="w-4 h-4" />
    </TooltipButton>
  );
};
