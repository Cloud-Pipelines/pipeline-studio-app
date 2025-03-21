import { useNavigate } from "@tanstack/react-router";
import StatusIcon from "./StatusIcon";
import TaskStatusBar from "./TaskStatusBar";
import { countTaskStatuses } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { APP_ROUTES } from "@/utils/constants";

const RunListItem = ({ runId }: { runId: number }) => {
  const navigate = useNavigate();
  const { data: details, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["pipeline-run-details", runId],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${runId}/details`,
      ).then((res) => res.json()),
  });
  const { data: state, isLoading: isStateLoading } = useQuery({
    queryKey: ["pipeline-run-state", runId],
    queryFn: () =>
      fetch(
        `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${runId}/state`,
      ).then((res) => res.json()),
  });

  if (isDetailsLoading || isStateLoading) {
    return <div>Loading...</div>;
  }

  const statusCounts = countTaskStatuses(details, state);

  const handleOnClick = (runId: number) => {
    navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
  };
  const currentStatus = () => {
    if (statusCounts.failed > 0) {
      return "FAILED";
    }
    if (statusCounts.running > 0) {
      return "RUNNING";
    }
    if (statusCounts.succeeded > 0) {
      return "SUCCEEDED";
    }

    return "PENDING";
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleOnClick(runId);
      }}
      className="flex flex-col p-2 text-sm hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <StatusIcon status={currentStatus()} />
          <span>{details.task_spec.componentRef.spec.name}</span>
          <span className="text-gray-500 text-xs">#{runId}</span>
        </div>
        {statusCounts && (
          <div className="text-xs text-gray-500 mt-1">
            <span className="text-green-500">
              {" "}
              {statusCounts.succeeded} succeeded
            </span>
            ,
            {statusCounts.failed > 0 && (
              <span className="text-red-500">
                {" "}
                {statusCounts.failed} failed
              </span>
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

      <TaskStatusBar statusCounts={statusCounts} />
    </div>
  );
};

export default RunListItem;
