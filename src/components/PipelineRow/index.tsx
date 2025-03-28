import { Link, useNavigate } from "@tanstack/react-router";
import { List } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  GetExecutionInfoResponse,
  GetGraphExecutionStateResponse,
} from "@/api/types.gen";
import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import { TableCell, TableRow } from "@/components/ui/table";
import { API_URL, EDITOR_PATH } from "@/utils/constants";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import RunListItem from "./RunListItem";
import StatusIcon from "./StatusIcon";
import { type PipelineRowProps, type TaskStatusCounts } from "./types";
import { countTaskStatuses, formatDate, getRunStatus } from "./utils";

const PipelineRow = ({ url, componentRef, name, modificationTime }: PipelineRowProps) => {
  const [rowData, setRowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [runTaskStatuses, setRunTaskStatuses] = useState<
    Record<number, TaskStatusCounts>
  >({});
  const navigate = useNavigate();

  useEffect(() => {
    if (componentRef) {
      if (!componentRef.spec) {
        console.error(`Component ref for ${name} has no spec:`, componentRef);
        setError("Invalid component reference");
        return;
      }
      setRowData(componentRef.spec);
      return;
    }

    if (url) {
      const fetchRowData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await downloadDataWithCache(url, loadObjectFromYamlData);
          setRowData(data);
        } catch (error) {
          console.error(`Error fetching data from ${url}:`, error);
          setError("Failed to load pipeline data");
        } finally {
          setIsLoading(false);
        }
      };
      fetchRowData();
    }
  }, [url, componentRef, name]);

  useEffect(() => {
    const fetchData = async () => {
      if (!name) return;

      const res = await fetchPipelineRuns(name);

      if (!res) return;

      setPipelineRuns(res.runs);
      setLatestRun(res.latestRun);
    };

    fetchData();
  }, [name]);

  useEffect(() => {
    const fetchTaskStatuses = async () => {
      if (pipelineRuns.length === 0) return;

      const statuses: Record<number, TaskStatusCounts> = {};

      for (const run of pipelineRuns) {
        try {
          const response = await fetch(
            `${API_URL}/api/executions/${run.id}/details`,
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch execution details: ${response.statusText}`,
            );
          }
          const details: GetExecutionInfoResponse = await response.json();

          const stateResponse = await fetch(
            `${API_URL}/api/executions/${run.id}/state`,
          );
          if (!stateResponse.ok) {
            throw new Error(
              `Failed to fetch execution state: ${stateResponse.statusText}`,
            );
          }
          const stateData: GetGraphExecutionStateResponse =
            await stateResponse.json();

          statuses[run.id] = countTaskStatuses(details, stateData);
        } catch (error) {
          console.error(
            `Error fetching task statuses for run ${run.id}:`,
            error,
          );
        }
      }

      setRunTaskStatuses(statuses);
    };

    fetchTaskStatuses();
  }, [pipelineRuns]);

  const handleOpenInEditor = (e: React.MouseEvent) => {
    const isAccordionClick =
      (e.target as HTMLElement).closest("[data-popover-trigger]") !== null;
    if (!isAccordionClick) {
      if (e.metaKey || e.ctrlKey) {
        // Open in new tab using window.open instead of navigate with target
        const safeName = name || "unnamed";
        window.open(
          `${window.location.origin}${EDITOR_PATH}/${encodeURIComponent(safeName)}`,
          "_blank",
        );
      } else {
        navigate({ to: `${EDITOR_PATH}/${name}` });
      }
    }
  };

  if (isLoading) return <div className="py-2">Loading...</div>;
  if (error) return <div className="py-2 text-red-500">{error}</div>;

  const pipelineSpec = componentRef?.spec || rowData;
  const displayName = name || pipelineSpec?.name || "Unnamed Pipeline";

  const LinkProps = {
    to: `${EDITOR_PATH}/${encodeURIComponent(name || "")}`,
    className: "underline hover:text-blue-500",
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the row click handler
    },
  };

  if (latestRun) {
    const statusData = runTaskStatuses[latestRun.id];
    if (statusData) {
      latestRun.status = getRunStatus(statusData);
    }
  }

  return (
    <TableRow onClick={handleOpenInEditor} className="cursor-pointer">
      <TableCell className="text-sm">
        <Link {...LinkProps}>{displayName}</Link>
      </TableCell>
      <TableCell className="text-gray-500 text-xs">
        {modificationTime ? formatDate(modificationTime.toISOString()) : "N/A"}
      </TableCell>
      <TableCell className="text-gray-500 text-xs">
        {latestRun ? (
          <div className="flex items-center gap-1">
            {latestRun && runTaskStatuses[latestRun.id] && (
              <StatusIcon status={latestRun.status} />
            )}
            <p>{formatDate(latestRun.created_at)}</p>
            {/* <p>{`(ran for 0h:12m:38s)`}</p> */}
          </div>
        ) : (
          "None"
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
              <div className="text-sm mb-2">Runs - {pipelineRuns.length}</div>
              <ScrollArea className="h-[300px]">
                {pipelineRuns.map((run) => (
                  <RunListItem
                    key={run.root_execution_id}
                    runId={`${run.root_execution_id}`}
                  />
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
