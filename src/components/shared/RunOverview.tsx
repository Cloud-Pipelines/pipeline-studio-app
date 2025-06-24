import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBar, StatusIcon, StatusText } from "@/components/shared/Status/";
import { useExecutionStatusQuery } from "@/hooks/useExecutionStatusQuery";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/routes/router";
import {
  countTaskStatuses,
  fetchExecutionInfo,
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
    showStatusCounts?: "shorthand" | "full" | "none";
    showAuthor?: boolean;
  };
  className?: string;
}

const defaultConfig = {
  showStatus: true,
  showName: true,
  showExecutionId: true,
  showCreatedAt: true,
  showTaskStatusBar: true,
  showStatusCounts: undefined,
  showAuthor: false,
};

const RunOverview = ({
  run,
  config = defaultConfig,
  className = "",
}: RunOverviewProps) => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const executionId = `${run.root_execution_id}`;
  const { data: status } = useExecutionStatusQuery(executionId);

  const { data, isLoading, error } = fetchExecutionInfo(executionId);
  const { details, state } = data;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPipelineRunById(`${run.id}`);
      if (!res) return;

      const runData = res as PipelineRun;

      runData.status = status;

      setMetadata(runData);
      setLoadingMetadata(false);
    };

    fetchData();
  }, [run.id, status]);

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
      className={cn(
        "flex flex-col p-2 text-sm hover:bg-gray-50 cursor-pointer",
        className,
      )}
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
            <div className="flex items-center gap-2">
              <span>•</span>
              <span className="text-gray-500 text-xs">{`${formatDate(metadata.created_at || "")}`}</span>
            </div>
          )}
          {config?.showAuthor && metadata?.created_by && (
            <div className="flex items-center gap-1">
              <span className="mr-1">•</span>
              <span className="text-xs">Initiated by</span>
              <span className="text-gray-500 text-xs max-w-32 truncate">
                {metadata.created_by}
              </span>
            </div>
          )}
        </div>
        {config?.showStatusCounts && config.showStatusCounts !== "none" && (
          <StatusText
            statusCounts={statusCounts}
            shorthand={
              config.showStatusCounts === "shorthand" ||
              (config.showAuthor && !!metadata?.created_by)
            }
          />
        )}
      </div>

      {config?.showTaskStatusBar && <StatusBar statusCounts={statusCounts} />}
    </div>
  );
};

export default RunOverview;
