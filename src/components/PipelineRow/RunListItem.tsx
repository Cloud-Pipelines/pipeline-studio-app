import { useNavigate } from "@tanstack/react-router";
import StatusIcon from "./StatusIcon";
import TaskStatusBar from "./TaskStatusBar";
import { countTaskStatuses } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { APP_ROUTES } from "@/utils/constants";
import type { GetExecutionInfoResponse } from "@/api/models/GetExecutionInfoResponse";
import type { GetGraphExecutionStateResponse } from "@/api/models/GetGraphExecutionStateResponse";
import { ContainerExecutionStatus } from "@/api/models/ContainerExecutionStatus";

const API_URL = import.meta.env.VITE_BACKEND_API_URL ?? "";

const RunListItem = ({ runId }: { runId: number }) => {
  const navigate = useNavigate();

  const {
    data: details,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery<GetExecutionInfoResponse>({
    queryKey: ["pipeline-run-details", runId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/executions/${runId}/details`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch execution details: ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const {
    data: state,
    isLoading: isStateLoading,
    error: stateError,
  } = useQuery<GetGraphExecutionStateResponse>({
    queryKey: ["pipeline-run-state", runId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/executions/${runId}/state`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch execution state: ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  if (isDetailsLoading || isStateLoading) {
    return <div>Loading...</div>;
  }

  if (detailsError || stateError || !details || !state) {
    return (
      <div className="flex flex-col p-2 text-sm text-red-500">
        <span>Error loading run details</span>
        <span className="text-xs">
          {detailsError?.message || stateError?.message}
        </span>
      </div>
    );
  }

  const statusCounts = countTaskStatuses(details, state);

  const handleOnClick = (runId: number) => {
    navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
  };

  const currentStatus = () => {
    if (statusCounts.failed > 0) {
      return ContainerExecutionStatus.FAILED;
    }
    if (statusCounts.running > 0) {
      return ContainerExecutionStatus.RUNNING;
    }
    if (statusCounts.succeeded > 0) {
      return ContainerExecutionStatus.SUCCEEDED;
    }

    return ContainerExecutionStatus.PENDING;
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
          <span>{details?.task_spec?.componentRef?.spec?.name}</span>
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
