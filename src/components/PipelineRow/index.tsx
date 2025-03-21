import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import { EDITOR_PATH } from "@/utils/constants";
import localForage from "localforage";

import {
  type PipelineRowProps,
  type PipelineRun,
  type TaskStatusCounts,
} from "./types";
import { countTaskStatuses } from "./utils";
import StatusIcon from "./StatusIcon";
import RunListItem from "./RunListItem";

import { TableCell, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { List } from "lucide-react";

const PipelineRow = ({ url, componentRef, name }: PipelineRowProps) => {
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
    const fetchPipelineRuns = async () => {
      if (!name) return;

      try {
        const pipelineRunsDb = localForage.createInstance({
          name: "components",
          storeName: "pipeline_runs",
        });

        const runs: PipelineRun[] = [];
        let latestRun: PipelineRun | null = null;
        let latestDate = new Date(0);

        await pipelineRunsDb.iterate<PipelineRun, void>((run) => {
          if (run.pipeline_name === name) {
            runs.push(run);
            const runDate = new Date(run.created_at);
            if (runDate > latestDate) {
              latestDate = runDate;
              latestRun = run;
            }
          }
        });

        runs.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setPipelineRuns(runs);
        setLatestRun(latestRun);
      } catch (error) {
        console.error("Error fetching pipeline runs:", error);
      }
    };

    fetchPipelineRuns();
  }, [name]);

  useEffect(() => {
    const fetchTaskStatuses = async () => {
      if (pipelineRuns.length === 0) return;

      const statuses: Record<number, TaskStatusCounts> = {};

      for (const run of pipelineRuns) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${run.id}/details`,
          );
          const details = await response.json();

          const stateResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL ?? ""}/api/executions/${run.id}/state`,
          );
          const stateData = await stateResponse.json();

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
      navigate({ to: `${EDITOR_PATH}/${name}` });
    }
  };

  if (isLoading) return <div className="py-2">Loading...</div>;
  if (error) return <div className="py-2 text-red-500">{error}</div>;

  const pipelineSpec = componentRef?.spec || rowData;
  const displayName = name || pipelineSpec?.name || "Unnamed Pipeline";

  return (
    <TableRow onClick={handleOpenInEditor} className="cursor-pointer">
      <TableCell className="text-sm">{displayName}</TableCell>
      <TableCell>
        {latestRun && runTaskStatuses[latestRun.id] && (
          <StatusIcon status={latestRun.status} />
        )}
      </TableCell>
      <TableCell className="text-gray-500 text-xs">0:12:38</TableCell>
      <TableCell className="text-gray-500 text-xs">
        3/20/2025 12:00:00
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
                    runId={run.root_execution_id}
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
