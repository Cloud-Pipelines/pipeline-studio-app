import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBar, StatusIcon, StatusText } from "@/components/shared/Status/";
import { APP_ROUTES } from "@/routes/router";
import {
  countTaskStatuses,
  fetchExecutionInfo,
  fetchExecutionStatus,
  getRunStatus,
} from "@/services/executionService";
import { fetchPipelineRunById } from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import { formatDate } from "@/utils/date";

interface RunOverviewProps {
  run: PipelineRun;
  config?: {
    showStatus?: boolean;
    showName?: boolean;
    showExecutionId?: boolean;
    showCreatedAt?: boolean;
    showTaskStatusBar?: boolean;
    showStatusCounts?: boolean;
  };
}

const defaultConfig = {
  showStatus: true,
  showName: true,
  showExecutionId: true,
  showCreatedAt: true,
  showTaskStatusBar: true,
  showStatusCounts: true,
};

const RunOverview = ({ run, config = defaultConfig }: RunOverviewProps) => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const executionId = `${run.root_execution_id}`;

  const { data, isLoading, error } = fetchExecutionInfo(executionId);
  const { details, state } = data;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPipelineRunById(`${run.id}`);
      if (!res) return;

      const runData = res as PipelineRun;

      runData.status = await fetchExecutionStatus(`${res.root_execution_id}`);

      setMetadata(runData);
      setLoadingMetadata(false);
    };

    fetchData();
  }, [run]);

  if (isLoading || loadingMetadata) {
    return (
      <div className="flex flex-col p-2 text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      </div>
    );
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
          {config?.showName && <span>{run.pipeline_name}</span>}
          {config?.showExecutionId && (
            <div className="flex items-center gap-3">
              <StatusIcon status={getRunStatus(statusCounts)} />
              <div className="text-xs">{`#${executionId}`}</div>
            </div>
          )}
          {config?.showCreatedAt && metadata?.created_at && (
            <>
              <span>•</span>
              <span className="text-gray-500 text-xs">{`${formatDate(metadata?.created_at || "")}`}</span>
            </>
          )}
        </div>
        {config?.showStatusCounts && (
          <StatusText statusCounts={statusCounts} shorthand />
        )}
      </div>

      {config?.showTaskStatusBar && <StatusBar statusCounts={statusCounts} />}
    </div>
  );
};

export default RunOverview;
