import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { Icon } from "@/components/ui/icon";

type InspectPipelineButtonProps = {
  pipelineName: string;
};

export const InspectPipelineButton = ({
  pipelineName,
}: InspectPipelineButtonProps) => {
  const navigate = useNavigate();

  const handleInspect = useCallback(() => {
    navigate({ to: `/editor/${encodeURIComponent(pipelineName)}` });
  }, [pipelineName, navigate]);

  return (
    <TooltipButton
      variant="outline"
      onClick={handleInspect}
      tooltip="Inspect pipeline"
      data-testid="inspect-pipeline-button"
    >
      <Icon name="Network" className="rotate-270" />
    </TooltipButton>
  );
};
