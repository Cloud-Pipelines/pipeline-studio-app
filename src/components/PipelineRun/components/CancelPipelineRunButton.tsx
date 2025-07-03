import { useMutation } from "@tanstack/react-query";
import { CircleStopIcon } from "lucide-react";
import { useCallback, useState } from "react";

import ConfirmationDialog from "@/components/shared/Dialogs/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import useToastNotification from "@/hooks/useToastNotification";
import { cancelPipelineRun } from "@/services/pipelineRunService";

interface CancelPipelineRunButtonProps {
  runId: string | null | undefined;
}

export const CancelPipelineRunButton = ({
  runId,
}: CancelPipelineRunButtonProps) => {
  const notify = useToastNotification();

  const [isOpen, setIsOpen] = useState(false);

  const {
    mutate: cancelPipeline,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: cancelPipelineRun,
    onSuccess: () => {
      notify(`Pipeline run ${runId} cancelled`, "success");
    },
    onError: (error) => {
      notify(`Error cancelling run: ${error}`, "error");
    },
  });

  const handleConfirm = useCallback(async () => {
    setIsOpen(false);

    if (!runId) {
      notify(`Failed to cancel run. No run ID found.`, "warning");
      return;
    }

    try {
      cancelPipeline(runId);
    } catch (error) {
      notify(`Error cancelling run: ${error}`, "error");
    }
  }, [runId]);

  const onClick = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (isSuccess) {
    return <Button disabled>Cancelled</Button>;
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={onClick}
        disabled={isPending}
        data-testid="cancel-pipeline-run-button"
      >
        {isPending ? (
          <Spinner className="mr-2" />
        ) : (
          <div className="flex items-center gap-2">
            <CircleStopIcon className="w-4 h-4" /> Cancel run
          </div>
        )}
      </Button>

      <ConfirmationDialog
        isOpen={isOpen}
        title="Confirm run cancellation"
        description="The run will be scheduled for cancellation, and this action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};
