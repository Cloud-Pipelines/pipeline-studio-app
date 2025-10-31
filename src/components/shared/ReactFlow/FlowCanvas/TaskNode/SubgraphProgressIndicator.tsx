import StatusText from "@/components/shared/Status/StatusText";
import TaskStatusBar from "@/components/shared/Status/TaskStatusBar";
import type { TaskStatusCounts } from "@/types/pipelineRun";

interface SubgraphProgressIndicatorProps {
  statusCounts: TaskStatusCounts;
}

export const SubgraphProgressIndicator = ({
  statusCounts,
}: SubgraphProgressIndicatorProps) => {
  if (statusCounts.total === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <TaskStatusBar statusCounts={statusCounts} />
      <div className="mt-0.5">
        <StatusText statusCounts={statusCounts} shorthand />
      </div>
    </div>
  );
};
