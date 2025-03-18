import { type PipelineRun, type TaskStatusCounts } from "./types";
import StatusIcon from "./StatusIcon";
import TaskStatusBar from "./TaskStatusBar";
import { formatDate } from "./utils";

const RunListItem = ({
  run,
  statusCounts,
  onClick,
}: {
  run: PipelineRun;
  statusCounts?: TaskStatusCounts;
  onClick: (runId: number) => void;
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(run.id);
      }}
      className="flex flex-col p-2 text-sm border rounded-md hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <StatusIcon status={run.status} />
          <span>Run #{run.id}</span>
        </div>
        <div className="text-gray-500">{formatDate(run.created_at)}</div>
      </div>

      <TaskStatusBar statusCounts={statusCounts} />

      {statusCounts && (
        <div className="text-xs text-gray-500 mt-1">
          {statusCounts.succeeded} succeeded,
          {statusCounts.failed > 0 && (
            <span className="text-red-500"> {statusCounts.failed} failed</span>
          )}
          {statusCounts.running > 0 && (
            <span className="text-blue-500">
              {" "}
              {statusCounts.running} running
            </span>
          )}
          {statusCounts.pending > 0 && (
            <span> {statusCounts.pending} pending</span>
          )}
        </div>
      )}
    </div>
  );
};

export default RunListItem;
