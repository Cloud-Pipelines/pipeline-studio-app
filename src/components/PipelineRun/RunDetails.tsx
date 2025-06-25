import { useNavigate } from "@tanstack/react-router";
import {
  CirclePause,
  CircleSlash,
  CopyPlus,
  Frown,
  Network,
  RefreshCcw,
  Videotape,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExecutionStatusQuery } from "@/hooks/useExecutionStatusQuery";
import {
  countTaskStatuses,
  fetchExecutionInfo,
  getRunStatus,
} from "@/services/executionService";
import {
  copyRunToPipeline,
  fetchPipelineRunById,
} from "@/services/pipelineRunService";
import type { PipelineRun } from "@/types/pipelineRun";
import type { ComponentSpec } from "@/utils/componentSpec";
import { removeTrailingDateFromTitle } from "@/utils/string";

import TooltipButton from "../shared/Buttons/TooltipButton";
import { StatusBar, StatusIcon, StatusText } from "../shared/Status";
import { TaskImplementation } from "../shared/TaskDetails";

type RunDetailsProps = {
  executionId?: string;
};

export const RunDetails = ({ executionId = "" }: RunDetailsProps) => {
  const navigate = useNavigate();

  const { data: status } = useExecutionStatusQuery(executionId);

  const [metadata, setMetadata] = useState<PipelineRun | null>(null);

  const { data, isLoading, error } = fetchExecutionInfo(executionId);
  const { details, state } = data;

  const runId = details?.pipeline_run_id;

  const componentSpec = details?.task_spec?.componentRef?.spec as
    | ComponentSpec
    | null
    | undefined;

  const getInitialName = useCallback(() => {
    const dateTime = new Date().toISOString();
    const baseName = componentSpec?.name || "Pipeline";

    return `${removeTrailingDateFromTitle(baseName)} (${dateTime})`;
  }, [componentSpec]);

  const handleInspect = useCallback(() => {
    if (!componentSpec) {
      console.error("No componentSpec available for inspection");
      return;
    }
    navigate({ to: `/editor/${componentSpec.name}` });
  }, [componentSpec, navigate]);

  const handleClone = useCallback(async () => {
    const name = getInitialName();
    if (!componentSpec) {
      console.error("No component spec found");
      return;
    }

    const result = await copyRunToPipeline(componentSpec, name);
    if (result?.url) {
      navigate({ to: result.url });
    } else {
      console.error("Failed to copy run to pipeline");
    }
  }, [componentSpec, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPipelineRunById(`${runId}`);
      if (!res) return;

      const runData = res as PipelineRun;

      runData.status = status;

      setMetadata(runData);
    };

    fetchData();
  }, [runId, status]);

  if (error || !details || !state || !componentSpec) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center h-full">
        <Frown className="w-12 h-12 text-gray-500" />
        <div className="text-gray-500">Error loading run details.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="mr-2" />
        <p className="text-gray-500">Loading run details...</p>
      </div>
    );
  }

  const statusCounts = countTaskStatuses(details, state);
  const runStatus = getRunStatus(statusCounts);

  const annotations = componentSpec.metadata?.annotations || {};

  return (
    <div className="p-2 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Videotape className="w-6 h-6 text-gray-500" />
        <h2 className="text-lg font-semibold">
          {componentSpec.name ?? "Unnamed Pipeline"}
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <StatusIcon status={runStatus} />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span>{`Run ${runStatus.toLowerCase()}`}</span>
          </TooltipContent>
        </Tooltip>
      </div>

      {metadata && (
        <div className="flex flex-col gap-2 text-xs text-secondary-foreground mb-2">
          <div className="flex flex-wrap gap-x-6">
            {metadata.id && (
              <div>
                <span className="font-semibold">Run Id:</span> {metadata.id}
              </div>
            )}
            {metadata.root_execution_id && (
              <div>
                <span className="font-semibold">Execution Id:</span>{" "}
                {metadata.root_execution_id}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            {metadata.created_by && (
              <div>
                <span className="font-semibold">Created by:</span>{" "}
                {metadata.created_by}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6">
            {metadata.created_at && (
              <div>
                <span className="font-semibold">Created at:</span>{" "}
                {new Date(metadata.created_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex gap-2">
          <TooltipButton
            variant="outline"
            onClick={handleInspect}
            tooltip="Inspect pipeline"
          >
            <Network className="w-4 h-4 rotate-270" />
          </TooltipButton>
          <TooltipButton
            variant="outline"
            onClick={handleClone}
            tooltip="Clone pipeline"
          >
            <CopyPlus className="w-4 h-4" />
          </TooltipButton>
          <TooltipButton
            variant="outline"
            onClick={() => {
              console.log("Pause run action clicked");
            }}
            tooltip="Pause run"
          >
            <CirclePause className="w-4 h-4" />
          </TooltipButton>
          <TooltipButton
            variant="outline"
            onClick={() => {
              console.log("Cancel run action clicked");
            }}
            tooltip="Cancel run"
          >
            <CircleSlash className="w-4 h-4" />
          </TooltipButton>
          <TooltipButton
            variant="outline"
            onClick={() => {
              console.log("Rerun action clicked");
            }}
            tooltip="Rerun pipeline"
          >
            <RefreshCcw className="w-4 h-4" />
          </TooltipButton>
        </div>
      </div>

      {componentSpec.description && (
        <div>
          <h3 className="text-md font-medium mb-1">Description</h3>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {componentSpec.description}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-md font-medium mb-1">Status: {status}</h3>
          <div className="flex items-center gap-1 text-xs">
            <span>{`(`}</span>
            <StatusText statusCounts={statusCounts} />
            <span>{`)`}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <StatusBar statusCounts={statusCounts} />
        </div>
      </div>

      {Object.keys(annotations).length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-1">Annotations</h3>
          <ul className="text-xs text-secondary-foreground">
            {Object.entries(annotations).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold">{key}:</span>{" "}
                <span className="break-all">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-md font-medium mb-1">Artifacts</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">Inputs</h4>
            {componentSpec.inputs && componentSpec.inputs.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-secondary-foreground">
                {componentSpec.inputs.map((input) => (
                  <li key={input.name}>
                    <span className="font-semibold">{input.name}</span>
                    {input.type && (
                      <span className="ml-2 text-muted-foreground">
                        (
                        {typeof input.type === "string" ? input.type : "object"}
                        )
                      </span>
                    )}
                    {input.description && (
                      <div className="text-xs text-secondary-foreground ml-4">
                        {input.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground">No inputs</div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">Outputs</h4>
            {componentSpec.outputs && componentSpec.outputs.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-secondary-foreground">
                {componentSpec.outputs.map((output) => (
                  <li key={output.name}>
                    <span className="font-semibold">{output.name}</span>
                    {output.type && (
                      <span className="ml-2 text-muted-foreground">
                        (
                        {typeof output.type === "string"
                          ? output.type
                          : "object"}
                        )
                      </span>
                    )}
                    {output.description && (
                      <div className="text-xs text-secondary-foreground ml-4">
                        {output.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground">No outputs</div>
            )}
          </div>
        </div>
      </div>

      {componentSpec && (
        <div className="flex flex-col">
          <div className="font-medium text-md flex items-center gap-1 cursor-pointer">
            Pipeline YAML
          </div>
          <div className="mt-1 max-h-[512px] overflow-y-auto">
            <TaskImplementation
              displayName={componentSpec.name ?? "Pipeline"}
              componentSpec={componentSpec}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RunDetails;
