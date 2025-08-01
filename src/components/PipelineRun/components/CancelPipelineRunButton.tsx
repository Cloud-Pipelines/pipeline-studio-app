import { CircleSlash, CircleX } from "lucide-react";
import { useCallback, useState } from "react";

import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import ConfirmationDialog from "@/components/shared/Dialogs/ConfirmationDialog";
import { Spinner } from "@/components/ui/spinner";
import useToastNotification from "@/hooks/useToastNotification";
import { useBackend } from "@/providers/BackendProvider";
import { usePipelineRun } from "@/providers/PipelineRunProvider";
import { isStatusCancelled } from "@/services/executionService";

export const CancelPipelineRunButton = () => {
  const { cancel, isCancelling, status } = usePipelineRun();
  const { available } = useBackend();
  const notify = useToastNotification();

  const [isOpen, setIsOpen] = useState(false);

  const isCancelled = isStatusCancelled(status.run);

  const handleConfirm = useCallback(async () => {
    setIsOpen(false);

    try {
      await cancel();
    } catch (error) {
      notify(`Error cancelling run: ${error}`, "error");
    }
  }, [cancel, notify]);

  const onClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (isCancelling) {
    return (
      <TooltipButton
        disabled
        tooltip="Cancelling run..."
        variant="outline"
        className="border-destructive font-light text-destructive"
      >
        <Spinner className="text-destructive" /> Cancelling...
      </TooltipButton>
    );
  }

  if (isCancelled) {
    return (
      <TooltipButton disabled tooltip="Run cancelled">
        <CircleSlash className="w-4 h-4" />
      </TooltipButton>
    );
  }

  return (
    <>
      <TooltipButton
        variant="destructive"
        onClick={onClick}
        tooltip="Cancel run"
        disabled={!available}
        data-testid="cancel-pipeline-run-button"
      >
        <div className="flex items-center gap-2">
          <CircleX className="w-4 h-4" />
        </div>
      </TooltipButton>

      <ConfirmationDialog
        isOpen={isOpen}
        title="Cancel run"
        description="The run will be scheduled for cancellation. This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
