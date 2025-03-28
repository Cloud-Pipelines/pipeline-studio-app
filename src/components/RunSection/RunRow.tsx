import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { TableCell, TableRow } from "@/components/ui/table";
import { API_URL, APP_ROUTES } from "@/utils/constants";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

import StatusIcon from "../PipelineRow/StatusIcon";
import StatusText from "../PipelineRow/StatusText";
import TaskStatusBar from "../PipelineRow/TaskStatusBar";
import {
  countTaskStatuses,
  formatDate,
  getRunStatus,
} from "../PipelineRow/utils";

const RunRow = ({ runId }: { runId: string }) => {
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

  const clickThroughUrl = `${APP_ROUTES.RUNS}/${runId}`;

  const LinkProps = {
    to: clickThroughUrl,
    className: "underline hover:text-blue-500 text-black",
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the row click handler
    },
  };

  return (
    <TableRow
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: clickThroughUrl });
      }}
      className="cursor-pointer text-gray-500 text-xs"
    >
      <TableCell className="text-sm flex items-center gap-2">
        <StatusIcon status={getRunStatus(statusCounts)} />
        <Link {...LinkProps}>{name}</Link>
        <span>{`#${runId}`}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-1/2">
            <TaskStatusBar statusCounts={statusCounts} />
          </div>
          <div className="w-1/2">
            {statusCounts && <StatusText statusCounts={statusCounts} />}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {metadata ? `${formatDate(metadata.created_at)}` : "Data not found..."}
      </TableCell>
      <TableCell>
        {metadata ? `${metadata.created_by ?? "Unknown user"}` : ""}
      </TableCell>
    </TableRow>
  );
};

export default RunRow;
