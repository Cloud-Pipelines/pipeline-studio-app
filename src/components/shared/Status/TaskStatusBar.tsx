import type { TaskStatusCounts } from "@/services/executionService";

const TaskStatusBar = ({
  statusCounts,
}: {
  statusCounts?: TaskStatusCounts;
}) => {
  if (!statusCounts || statusCounts.total === 0) {
    return (
      <div className="flex h-2 w-full rounded overflow-hidden bg-gray-200"></div>
    );
  }

  const { total, succeeded, failed, running, waiting, skipped, cancelled } =
    statusCounts;

  // Calculate percentages for each segment
  const successWidth = `${(succeeded / total) * 100}%`;
  const failedWidth = `${(failed / total) * 100}%`;
  const runningWidth = `${(running / total) * 100}%`;
  const waitingWidth = `${(waiting / total) * 100}%`;
  const skippedWidth = `${(skipped / total) * 100}%`;
  const cancelledWidth = `${(cancelled / total) * 100}%`;

  return (
    <div className="flex h-2 w-full rounded overflow-hidden bg-gray-200">
      {succeeded > 0 && (
        <div className="bg-green-500" style={{ width: successWidth }}></div>
      )}
      {failed > 0 && (
        <div className="bg-red-500" style={{ width: failedWidth }}></div>
      )}
      {running > 0 && (
        <div className="bg-blue-500" style={{ width: runningWidth }}></div>
      )}
      {waiting > 0 && (
        <div className="bg-gray-200" style={{ width: waitingWidth }}></div>
      )}
      {skipped > 0 && (
        <div className="bg-gray-800" style={{ width: skippedWidth }}></div>
      )}
      {cancelled > 0 && (
        <div className="bg-orange-500" style={{ width: cancelledWidth }}></div>
      )}
    </div>
  );
};

export default TaskStatusBar;
