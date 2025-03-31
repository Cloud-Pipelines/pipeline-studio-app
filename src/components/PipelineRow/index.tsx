import { useNavigate } from "@tanstack/react-router";
import { List } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TableCell, TableRow } from "@/components/ui/table";
import { EDITOR_PATH } from "@/utils/constants";
import { fetchExecutionStatus } from "@/utils/fetchExecutionStatus";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import RunListItem from "./RunListItem";
import StatusIcon from "./StatusIcon";
import { type PipelineRowProps } from "./types";
import { formatDate } from "./utils";

const PipelineRow = ({ name, modificationTime }: PipelineRowProps) => {
  const navigate = useNavigate();
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);

  const handleFetchRuns = useCallback(async () => {
    if (!name) return;

    const res = await fetchPipelineRuns(name);
    if (!res) return;

    if (res.latestRun) {
      const latestRun = res.latestRun as PipelineRun;
      latestRun.status = await fetchExecutionStatus(
        `${latestRun.root_execution_id}`,
      );
      setLatestRun(latestRun);
    }

    setPipelineRuns(res.runs);
  }, [name]);

  useEffect(() => {
    handleFetchRuns();
  }, [handleFetchRuns]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate if clicking on the popover trigger
      if ((e.target as HTMLElement).closest("[data-popover-trigger]")) {
        return;
      }
      navigate({ to: `${EDITOR_PATH}/${name}` });
    },
    [navigate, name],
  );

  const formattedDate = useMemo(() => {
    if (!modificationTime) return "N/A";
    return formatDate(modificationTime.toISOString());
  }, [modificationTime]);

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      <TableCell>
        <a href={`${EDITOR_PATH}/${name}`} className="hover:underline">
          {name}
        </a>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formattedDate}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {latestRun ? (
          <div className="flex items-center gap-2">
            <StatusIcon status={latestRun.status} />
            <span>{formatDate(latestRun.created_at)}</span>
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        {pipelineRuns.length > 0 && (
          <Popover>
            <PopoverTrigger
              data-popover-trigger
              className="cursor-pointer text-gray-500 border border-gray-200 rounded-md p-1 hover:bg-gray-200"
            >
              <List className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent className="w-[500px]">
              <div className="text-sm mb-2">
                <span className="font-bold">
                  {pipelineRuns[0].pipeline_name}
                </span>{" "}
                - {pipelineRuns.length} runs
              </div>
              <ScrollArea className="h-[300px]">
                {pipelineRuns.map((run) => (
                  <RunListItem key={run.id} run={run} />
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </TableCell>
    </TableRow>
  );
};

export default PipelineRow;
