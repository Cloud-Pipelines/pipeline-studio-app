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

const RunListItem = ({ runId }: { runId: string }) => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);

  const { data, isLoading, error } = fetchExecutionInfo(runId);
  const { details, state } = data;

  console.log(data, metadata);

  const name = details?.task_spec?.componentRef?.spec?.name;

  useEffect(() => {
    const fetchData = async () => {
      // if (!name) return;

      const res = await fetchPipelineRunById(runId);
      if (!res) return;

      const run = res as PipelineRun;

      run.status = await fetchExecutionStatus(`${res.root_execution_id}`);

      // if (run.pipeline_name === "purple spend whose lost") {
      // console.log(`run ${runId}`, run);
      // }

      setMetadata(res);
    };

    fetchData();
  }, [runId]);

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

  const handleOnClick = (runId: string) => {
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
