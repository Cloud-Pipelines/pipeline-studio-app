import { type TaskStatusCounts } from "./types";

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

  const { total, succeeded, failed, running, pending } = statusCounts;

  // Calculate percentages for each segment
  const successWidth = `${(succeeded / total) * 100}%`;
  const failedWidth = `${(failed / total) * 100}%`;
  const runningWidth = `${(running / total) * 100}%`;
  const pendingWidth = `${(pending / total) * 100}%`;

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
      {pending > 0 && (
        <div className="bg-gray-200" style={{ width: pendingWidth }}></div>
      )}
    </div>
  );
};

export default TaskStatusBar;
