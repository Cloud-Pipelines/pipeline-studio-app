import { useNavigate } from "@tanstack/react-router";
import { Network } from "lucide-react";
import { useCallback } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";

type InspectPipelineButtonProps = {
  pipelineName?: string;
};

export const InspectPipelineButton = ({
  pipelineName,
}: InspectPipelineButtonProps) => {
  const navigate = useNavigate();

  const handleInspect = useCallback(() => {
    navigate({ to: `/editor/${pipelineName}` });
  }, [pipelineName, navigate]);

  return (
    <TooltipButton
      variant="outline"
      onClick={handleInspect}
      tooltip="Inspect pipeline"
      data-testid="inspect-pipeline-button"
    >
      <Network className="w-4 h-4 rotate-270" />
    </TooltipButton>
  );
};
