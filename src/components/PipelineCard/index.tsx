import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import { APP_ROUTES, EDITOR_PATH } from "@/utils/constants";
import localForage from "localforage";

import {
  type PipelineCardProps,
  type PipelineRun,
  type TaskStatusCounts,
} from "./types";
import { USE_MOCK_DATA, generateMockData } from "./mockData";
import { countTaskStatuses } from "./utils";
import StatusIcon from "./StatusIcon";
import RunListItem from "./RunListItem";
import TaskStatusBar from "./TaskStatusBar";

const PipelineCard = ({ url, componentRef, name }: PipelineCardProps) => {
  const [cardData, setCardData] = useState<any>(null);
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
      setCardData(componentRef.spec);
      return;
    }

    if (url) {
      const fetchCardData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await downloadDataWithCache(url, loadObjectFromYamlData);
          setCardData(data);
        } catch (error) {
          console.error(`Error fetching data from ${url}:`, error);
          setError("Failed to load pipeline data");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCardData();
    }
  }, [url, componentRef, name]);

  useEffect(() => {
    const fetchPipelineRuns = async () => {
      if (!name) return;

      if (USE_MOCK_DATA) {
        const { mockRuns } = generateMockData(name);
        setPipelineRuns(mockRuns);
        setLatestRun(mockRuns[0]);
        return;
      }

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

      if (USE_MOCK_DATA) {
        const { mockTaskStatuses } = generateMockData(name || "");
        setRunTaskStatuses(mockTaskStatuses);
        return;
      }

      const statuses: Record<number, TaskStatusCounts> = {};

      for (const run of pipelineRuns) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL}executions/${run.id}/details`,
          );
          const details = await response.json();

          const stateResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_API_URL}executions/${run.id}/state`,
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
      (e.target as HTMLElement).closest("[data-accordion-trigger]") !== null;
    if (!isAccordionClick) {
      navigate({ to: `${EDITOR_PATH}/${name}` });
    }
  };

  const handleViewRun = (runId: number) => {
    navigate({ to: `${APP_ROUTES.RUNS}/${runId}` });
  };

  if (isLoading) return <div className="py-2">Loading...</div>;
  if (error) return <div className="py-2 text-red-500">{error}</div>;

  const pipelineSpec = componentRef?.spec || cardData;
  const displayName = name || pipelineSpec?.name || "Unnamed Pipeline";
  const taskCount = pipelineSpec?.implementation?.graph?.tasks
    ? Object.keys(pipelineSpec.implementation.graph.tasks).length
    : 0;

  return (
    <AccordionItem value={name || ""}>
      <div
        onClick={handleOpenInEditor}
        className="grid grid-cols-3 items-center p-1 hover:bg-gray-50 cursor-pointer"
      >
        <div className="text-sm font-medium truncate">{displayName}</div>

        <div className="text-sm text-gray-500 justify-self-center">
          {taskCount > 0 ? `${taskCount} tasks` : "No tasks"}
        </div>
        <div className="justify-self-end items-center flex flex-row gap-1">
          {latestRun && runTaskStatuses[latestRun.id] && (
            <div className="w-32 mr-1 flex flex-row items-center gap-1">
              <StatusIcon status={latestRun.status} />
              <TaskStatusBar statusCounts={runTaskStatuses[latestRun.id]} />
            </div>
          )}
          <div className="flex flex-row items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              data-accordion-trigger
              className="flex items-center gap-1 cursor-pointer"
            >
              <AccordionTrigger className="cursor-pointer" />
            </Button>
          </div>
        </div>
      </div>
      <AccordionContent>
        <div className="py-2 space-y-2">
          <h3 className="font-medium text-sm">Pipeline Runs</h3>

          {pipelineRuns.length === 0 ? (
            <p className="text-sm text-gray-500">No runs available</p>
          ) : (
            <div className="space-y-1">
              {pipelineRuns.map((run) => (
                <RunListItem
                  key={run.id}
                  run={run}
                  statusCounts={runTaskStatuses[run.id]}
                  onClick={handleViewRun}
                />
              ))}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default PipelineCard;
