import { Link, useNavigate } from "@tanstack/react-router";
import { List } from "lucide-react";
import { useEffect, useState } from "react";

import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import { TableCell, TableRow } from "@/components/ui/table";
import { EDITOR_PATH } from "@/utils/constants";
import { fetchExecutionStatus } from "@/utils/fetchExecutionStatus";
import { fetchPipelineRuns, type PipelineRun } from "@/utils/fetchPipelineRuns";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import RunListItem from "./RunListItem";
import StatusIcon from "./StatusIcon";
import { type PipelineRowProps } from "./types";
import { formatDate } from "./utils";

const PipelineRow = ({
  url,
  componentRef,
  name,
  modificationTime,
}: PipelineRowProps) => {
  const navigate = useNavigate();

  const [rowData, setRowData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [latestRun, setLatestRun] = useState<PipelineRun | null>(null);

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

      if (res.latestRun) {
        const latestRun = res.latestRun as PipelineRun;

        // if (latestRun.pipeline_name === "purple spend whose lost") {
        //   console.log(latestRun);
        // }

        latestRun.status = await fetchExecutionStatus(
          `${latestRun.root_execution_id}`,
        );

        setLatestRun(latestRun);
      }

      console.log(res.runs);

      setPipelineRuns(res.runs);
    };

    fetchData();
  }, [name]);

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
            {latestRun.status && <StatusIcon status={latestRun.status} />}
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
