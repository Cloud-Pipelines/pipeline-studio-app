import { useMemo } from "react";

import RunOverview from "@/components/shared/RunOverview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { usePipelineRuns } from "@/providers/PipelineRunsProvider";

const RecentExecutions = () => {
  const { runs, recentRuns, isLoading, error } = usePipelineRuns();

  const runOverviews = useMemo(
    () =>
      recentRuns.map((run) => (
        <a key={run.id} href={`/runs/${run.root_execution_id}`} tabIndex={0}>
          <RunOverview
            run={run}
            config={{
              showStatus: true,
              showName: false,
              showExecutionId: true,
              showCreatedAt: true,
              showTaskStatusBar: false,
              showStatusCounts: "full",
              showAuthor: true,
            }}
            className="rounded-sm"
          />
        </a>
      )),
    [recentRuns],
  );

  const remainingRuns = runs.length - recentRuns.length;

  if (isLoading) {
    return (
      <div>
        <h3 className="text-md font-medium mb-1">Recent Executions</h3>
        <div className="h-48 bg-gray-100 border border-gray-300 rounded p-2 flex items-center justify-center">
          <Spinner className="mr-2" />
          <p className="text-secondary-foreground">
            Loading recent executions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-md font-medium mb-1">Recent Executions</h3>
        <div className="h-48 bg-gray-100 border border-gray-300 rounded p-2 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-md font-medium mb-1">Recent Executions</h3>
      {recentRuns.length === 0 ? (
        <div className="text-xs text-muted-foreground">No runs yet.</div>
      ) : (
        <ScrollArea className="h-fit bg-gray-100 border border-gray-300 rounded p-2">
          {runOverviews}
          {remainingRuns > 0 && (
            <div className="mt-2 text-xs text-muted-foreground w.full text-center">
              +{remainingRuns} more executions
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};

export default RecentExecutions;
