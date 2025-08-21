import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/providers/BackendProvider";
import { useFetchContainerExecutionState } from "@/services/executionService";
import { EXIT_CODE_OOM } from "@/utils/constants";
import { formatDate, formatDuration } from "@/utils/date";

import { InfoBox } from "../InfoBox";

interface ExecutionDetailsProps {
  executionId: string;
}

export const ExecutionDetails = ({ executionId }: ExecutionDetailsProps) => {
  const { backendUrl } = useBackend();

  const {
    data: containerState,
    isLoading: isLoadingContainerState,
    error: containerStateError,
  } = useFetchContainerExecutionState(executionId || "", backendUrl);

  // Don't render if no execution data is available
  const hasExecutionData =
    executionId ||
    containerState ||
    isLoadingContainerState ||
    containerStateError;
  if (!hasExecutionData) {
    return null;
  }

  return (
    <div className="flex flex-col px-3 py-2">
      <Collapsible defaultOpen>
        <div className="font-medium text-sm text-foreground flex items-center gap-1">
          Execution Details
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs text-foreground min-w-fit">
              Execution ID:
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {executionId}
            </span>
          </div>

          {isLoadingContainerState && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          )}

          {containerStateError && (
            <InfoBox title="Failed to load container state" variant="error">
              {containerStateError.message}
            </InfoBox>
          )}

          {!!containerState?.exit_code && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium text-xs text-destructive">
                Exit Code:
              </span>
              <span className="text-xs text-destructive">
                {containerState.exit_code}
              </span>
              {containerState.exit_code === EXIT_CODE_OOM && (
                <span className="text-xs text-destructive">
                  (Out of Memory)
                </span>
              )}
            </div>
          )}

          {containerState?.started_at && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-foreground min-w-fit">
                Started:
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(containerState.started_at)}
              </span>
            </div>
          )}

          {containerState?.ended_at && containerState?.started_at && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-foreground min-w-fit">
                Completed in:
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDuration(
                  containerState.started_at,
                  containerState.ended_at,
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatDate(containerState.ended_at)})
              </span>
            </div>
          )}

          {!isLoadingContainerState &&
            !containerState &&
            !containerStateError && (
              <div className="text-xs text-muted-foreground">
                Container state not available
              </div>
            )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
