import { useNavigate } from "@tanstack/react-router";

import { StatusBar, StatusIcon, StatusText } from "@/components/shared/Status/";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/routes/router";
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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: `${APP_ROUTES.RUNS}/${run.root_execution_id}` });
      }}
      className={cn(
        "flex flex-col p-2 text-sm hover:bg-gray-50 cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {config?.showName && <span>{run.pipeline_name}</span>}
          <div className="flex items-center gap-3">
            {config?.showStatus && <StatusIcon status={run.status} />}
            {config?.showExecutionId && (
              <div className="text-xs">{`#${run.root_execution_id}`}</div>
            )}
          </div>
          {config?.showCreatedAt && run.created_at && (
            <div className="flex items-center gap-2">
              <span>•</span>
              <span className="text-gray-500 text-xs">{`${formatDate(run.created_at || "")}`}</span>
            </div>
          )}
          {config?.showAuthor && run.created_by && (
            <div className="flex items-center gap-1">
              <span className="mr-1">•</span>
              <span className="text-xs">Initiated by</span>
              <span className="text-gray-500 text-xs max-w-32 truncate">
                {run.created_by}
              </span>
            </div>
          )}
        </div>
        {config?.showStatusCounts &&
          config.showStatusCounts !== "none" &&
          run.statusCounts && (
            <StatusText
              statusCounts={run.statusCounts}
              shorthand={
                config.showStatusCounts === "shorthand" ||
                (config.showAuthor && !!run.created_by)
              }
            />
          )}
      </div>

      {config?.showTaskStatusBar && (
        <StatusBar statusCounts={run.statusCounts} />
      )}
    </div>
  );
};

export default RunOverview;
