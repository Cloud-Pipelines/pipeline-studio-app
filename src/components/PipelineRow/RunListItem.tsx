import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { APP_ROUTES } from "@/utils/constants";
import fetchExecutionInfo from "@/utils/fetchExecutionInfo";
import { fetchExecutionStatus } from "@/utils/fetchExecutionStatus";
import {
  fetchPipelineRunById,
  type PipelineRun,
} from "@/utils/fetchPipelineRuns";

import StatusIcon from "./StatusIcon";
import StatusText from "./StatusText";
import TaskStatusBar from "./TaskStatusBar";
import { countTaskStatuses, formatDate, getRunStatus } from "./utils";

const RunListItem = ({ run }: { run: PipelineRun }) => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);

  const executionId = `${run.root_execution_id}`;

  const { data, isLoading, error } = fetchExecutionInfo(executionId);
  const { details, state } = data;

  const name = details?.task_spec?.componentRef?.spec?.name;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPipelineRunById(`${run.id}`);
      if (!res) return;

      const runData = res as PipelineRun;

      runData.status = await fetchExecutionStatus(`${res.root_execution_id}`);

      setMetadata(runData);
    };

    fetchData();
  }, [run]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !details || !state) {
    return (
      <div className="flex flex-col p-2 text-sm text-red-500">
        <span>Error loading run details</span>
        <span className="text-xs">{error?.message}</span>
      </div>
    );
  }

  const statusCounts = countTaskStatuses(details, state);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: `${APP_ROUTES.RUNS}/${executionId}` });
      }}
      className="flex flex-col p-2 text-sm hover:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <StatusIcon status={getRunStatus(statusCounts)} />
          <span>{name}</span>
          <span className="text-gray-500 text-xs">{`#${executionId}`}</span>
          {metadata && (
            <>
              <span>•</span>
              <span className="text-gray-500 text-xs">{`${formatDate(metadata.created_at)}`}</span>
            </>
          )}
        </div>
        <StatusText statusCounts={statusCounts} shorthand />
      </div>

      <TaskStatusBar statusCounts={statusCounts} />
    </div>
  );
};

export default RunListItem;
