import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { API_URL, APP_ROUTES } from "@/utils/constants";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

import StatusIcon from "./StatusIcon";
import TaskStatusBar from "./TaskStatusBar";
import { countTaskStatuses, formatDate, getRunStatus } from "./utils";

const RunListItem = ({ runId }: { runId: number }) => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);

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

  const name = details?.task_spec?.componentRef?.spec?.name;

  useEffect(() => {
    const fetchData = async () => {
      if (!name) return;

      const res = await fetchPipelineRuns(name);
      if (!res) return;

      setMetadata(res.latestRun);
    };

    fetchData();
  }, [name]);

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
          <StatusIcon status={getRunStatus(statusCounts)} />
          <span>{name}</span>
          <span className="text-gray-500 text-xs">{`#${runId}`}</span>
          {metadata && (
            <>
              <span>•</span>
              <span className="text-gray-500 text-xs">{`${formatDate(metadata.created_at)}`}</span>
              {metadata.created_by && (
                <>
                  <span className="text-2xs">• Initated by</span>
                  <span className="text-2xs">{`${metadata.created_by}`}</span>
                </>
              )}
            </>
          )}
        </div>
        {statusCounts && (
          <div className="text-xs text-gray-500 mt-1">
            <span className="text-green-500">
              {" "}
              {statusCounts.succeeded} succeeded
            </span>
            {statusCounts.failed > 0 && (
              <span className="text-red-500">
                <span className="text-black">,</span> {statusCounts.failed}{" "}
                failed
              </span>
            )}
            {statusCounts.running > 0 && (
              <span className="text-blue-500">
                <span className="text-black">,</span> {statusCounts.running}{" "}
                running
              </span>
            )}
            {statusCounts.skipped > 0 && (
              <span className="text-gray-800">
                <span className="text-black">,</span> {statusCounts.skipped}{" "}
                skipped
              </span>
            )}
            {statusCounts.waiting > 0 && (
              <span className="text-gray-500">
                <span className="text-black">,</span> {statusCounts.waiting}{" "}
                waiting
              </span>
            )}
          </div>
        )}
      </div>

      <TaskStatusBar statusCounts={statusCounts} />
    </div>
  );
};

export default RunListItem;
